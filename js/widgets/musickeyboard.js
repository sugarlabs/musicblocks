// Copyright (c) 2015 Jefferson Lee
// Copyright (c) 2018 Ritwik Abhishek
// Copyright (c) 2018,19 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

function MusicKeyboard() {
    const BUTTONDIVWIDTH = 535; // 5 buttons
    const OUTERWINDOWWIDTH = 758;
    const INNERWINDOWWIDTH = 50;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    // Mapping between keycodes and virtual keyboard
    const BLACKKEYS = [87, 69, 82, 84, 89, 85, 73, 79];
    const WHITEKEYS = [65, 83, 68, 70, 71, 72, 74, 75, 76];

    var saveOnKeyDown = document.onkeydown;
    var saveOnKeyUp = document.onkeyup;

    var w = window.innerWidth;
    this._cellScale = w / 1200;

    var beginnerMode = localStorage.beginnerMode;

    this._stopOrCloseClicked = false;
    this.playingNow = false;

    this.instruments = [];
    this.noteNames = [];
    this.octaves = [];
    this.keyboardShown = true;
    this.layout = [];
    this.idContainer = [];

    // Map between keyboard element ids and the note associated with the key.
    this.noteMapper = {};
    this.blockNumberMapper = {};
    this.instrumentMapper = {};
    var selectedNotes = [];

    this._rowBlocks = [];

    // Each element in the array is [start time, note, id, duration, voice].
    this._notesPlayed = [];

    this.addRowBlock = function(rowBlock) {
        // In case there is a repeat block, use a unique block number
        // for each instance.
        while (this._rowBlocks.indexOf(rowBlock) !== -1) {
            rowBlock = rowBlock + 1000000;
        }

        this._rowBlocks.push(rowBlock);
    };

    this.processSelected = function() {
        if (this._notesPlayed.length === 0) {
            selectedNotes = [];
            return;
        }

        // We want to sort the list by startTime.
        this._notesPlayed.sort(function(a, b) {
            return a.startTime - b.startTime;
        });

        // Cluster notes that start at the same time.
        if (beginnerMode === "true") {
            var minimumDuration = 125; // 1/8 note
        } else {
            var minimumDuration = 62.5; // 1/16 note
        }

        var last = this._notesPlayed[0].startTime;
        for (var i = 1; i < this._notesPlayed.length; i++) {
            while (
                i < this._notesPlayed.length &&
                this._notesPlayed[i].startTime - last < minimumDuration
            ) {
                last = this._notesPlayed[i].startTime;
                this._notesPlayed[i].startTime = this._notesPlayed[
                    i - 1
                ].startTime;
                i++;
            }

            if (i < this._notesPlayed.length) {
                last = this._notesPlayed[i].startTime;
                this._notesPlayed[i].startTime =
                    this._notesPlayed[i - 1].startTime +
                    this._notesPlayed[i - 1].duration * 1000 +
                    minimumDuration;
            }
        }

        // selectedNotes is used for playback. Coincident notes are
        // grouped together. It is built from notesPlayed.

        selectedNotes = [
            {
                noteOctave: [this._notesPlayed[0].noteOctave],
                objId: [this._notesPlayed[0].objId],
                duration: [this._notesPlayed[0].duration],
                voice: [this._notesPlayed[0].voice],
                blockNumber: [this._notesPlayed[0].blockNumber],
                startTime: this._notesPlayed[0].startTime
            }
        ];

        var j = 0;
        for (var i = 1; i < this._notesPlayed.length; i++) {
            while (
                i < this._notesPlayed.length &&
                this._notesPlayed[i].startTime ===
                    this._notesPlayed[i - 1].startTime
            ) {
                selectedNotes[j].noteOctave.push(
                    this._notesPlayed[i].noteOctave
                );
                selectedNotes[j].objId.push(this._notesPlayed[i].objId);
                selectedNotes[j].duration.push(this._notesPlayed[i].duration);
                selectedNotes[j].voice.push(this._notesPlayed[i].voice);
                selectedNotes[j].blockNumber.push(
                    this._notesPlayed[i].blockNumber
                );
                i++;
            }

            j++;
            if (i < this._notesPlayed.length) {
                selectedNotes.push({
                    noteOctave: [this._notesPlayed[i].noteOctave],
                    objId: [this._notesPlayed[i].objId],
                    duration: [this._notesPlayed[i].duration],
                    voice: [this._notesPlayed[i].voice],
                    blockNumber: [this._notesPlayed[i].blockNumber],
                    startTime: this._notesPlayed[i].startTime
                });
            }
        }
    };

    this.addKeyboardShortcuts = function() {
        var that = this;
        var duration = 0;
        var startDate = {};
        var startTime = {};
        var temp1 = {};
        var temp2 = {};
        var prevKey = 0;

        var __startNote = function(event) {
            if (WHITEKEYS.indexOf(event.keyCode) !== -1) {
                var i = WHITEKEYS.indexOf(event.keyCode);
                var id = "whiteRow" + i.toString();
            } else if (BLACKKEYS.indexOf(event.keyCode) !== -1) {
                var i = BLACKKEYS.indexOf(event.keyCode);
                var id = "blackRow" + i.toString();
            }

            var ele = docById(id);
            if (id in startDate == false) {
                startDate[id] = new Date();
                startTime[id] = startDate[id].getTime();
            }

            if (ele !== null && ele !== undefined) {
                ele.style.backgroundColor = platformColor.orange;
                temp1[id] = ele.getAttribute("alt").split("__")[0];
                if (temp1[id] === "hertz") {
                    temp2[id] = parseInt(
                        ele.getAttribute("alt").split("__")[1]
                    );
                } else if (temp1[id] in FIXEDSOLFEGE1) {
                    temp2[id] =
                        FIXEDSOLFEGE1[temp1[id]]
                            .replace(SHARP, "#")
                            .replace(FLAT, "b") +
                        ele.getAttribute("alt").split("__")[1];
                } else {
                    temp2[id] =
                        temp1[id].replace(SHARP, "#").replace(FLAT, "b") +
                        ele.getAttribute("alt").split("__")[1];
                }

                that._logo.synth.trigger(
                    0,
                    temp2[id],
                    1,
                    that.instrumentMapper[id],
                    null,
                    null
                );
                prevKey = event.keyCode;
            }
        };

        var __keyboarddown = function(event) {
            __startNote(event);
        };

        var __endNote = function(event) {
            if (WHITEKEYS.indexOf(event.keyCode) !== -1) {
                var i = WHITEKEYS.indexOf(event.keyCode);
                var id = "whiteRow" + i.toString();
            } else if (BLACKKEYS.indexOf(event.keyCode) !== -1) {
                var i = BLACKKEYS.indexOf(event.keyCode);
                var id = "blackRow" + i.toString();
            }

            var ele = docById(id);
            newDate = new Date();
            newTime = newDate.getTime();
            duration = (newTime - startTime[id]) / 1000.0;

            if (ele !== null && ele !== undefined) {
                if (id.includes("blackRow")) {
                    ele.style.backgroundColor = "black";
                } else {
                    ele.style.backgroundColor = "white";
                }

                var no = ele.getAttribute("alt").split("__")[2];
                if (beginnerMode === "true") {
                    duration = parseFloat(
                        (Math.round(duration * 8) / 8).toFixed(3)
                    );
                } else {
                    duration = parseFloat(
                        (Math.round(duration * 16) / 16).toFixed(4)
                    );
                }

                if (duration === 0) {
                    duration = 0.125;
                } else if (duration < 0) {
                    duration = -duration;
                }

                that._logo.synth.stopSound(
                    0,
                    that.instrumentMapper[id],
                    temp2[id]
                );

                that._notesPlayed.push({
                    startTime: startTime[id],
                    noteOctave: temp2[id],
                    objId: id,
                    duration: duration,
                    voice: that.instrumentMapper[id],
                    blockNumber: that.blockNumberMapper[id]
                });
                that._createTable();

                delete startDate[id];
                delete startTime[id];
                delete temp1[id];
                delete temp2[id];
            }
        };

        var __keyboardup = function(event) {
            __endNote(event);
        };

        document.onkeydown = __keyboarddown;
        document.onkeyup = __keyboardup;
    };

    this.loadHandler = function(element, i, blockNumber) {
        var temp1 = this.layout[i].noteName;
        if (temp1 === "hertz") {
            var temp2 = this.layout[i].noteOctave;
        } else if (temp1 in FIXEDSOLFEGE1) {
            var temp2 =
                FIXEDSOLFEGE1[temp1].replace(SHARP, "#").replace(FLAT, "b") +
                this.layout[i].noteOctave;
        } else {
            var temp2 =
                temp1.replace(SHARP, "#").replace(FLAT, "b") +
                this.layout[i].noteOctave;
        }

        this.blockNumberMapper[element.id] = blockNumber;
        this.instrumentMapper[element.id] = this.layout[i].voice;
        this.noteMapper[element.id] = temp2;

        var that = this;
        var duration = 0;
        var startDate = new Date();
        var startTime = 0;

        var __startNote = function(element) {
            startDate = new Date();
            startTime = startDate.getTime(); // Milliseconds();
            element.style.backgroundColor = platformColor.orange;
            that._logo.synth.trigger(
                0,
                that.noteMapper[element.id],
                1,
                that.instrumentMapper[element.id],
                null,
                null
            );
        };

        element.onmousedown = function() {
            __startNote(this);
        };

        var __endNote = function(element) {
            var id = element.id;
            if (id.includes("blackRow")) {
                element.style.backgroundColor = "black";
            } else {
                element.style.backgroundColor = "white";
            }

            var now = new Date();
            duration = now.getTime() - startTime;
            duration /= 1000;
            that._logo.synth.stopSound(
                0,
                that.instrumentMapper[element.id],
                that.noteMapper[element.id]
            );
            if (beginnerMode === "true") {
                duration = parseFloat(
                    (Math.round(duration * 8) / 8).toFixed(3)
                );
            } else {
                duration = parseFloat(
                    (Math.round(duration * 16) / 16).toFixed(4)
                );
            }

            if (duration === 0) {
                duration = 0.125;
            } else if (duration < 0) {
                duration = -duration;
            }

            that._notesPlayed.push({
                startTime: startTime,
                noteOctave: that.noteMapper[element.id],
                objId: element.id,
                duration: duration,
                voice: that.instrumentMapper[element.id],
                blockNumber: that.blockNumberMapper[element.id]
            });
            that._createTable();
        };

        element.onmouseout = function() {
            // __endNote();
        };

        element.onmouseup = function() {
            __endNote(this);
        };
    };

    this.init = function(logo) {
        this._logo = logo;

        this.playingNow = false;
        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;

        var widgetWindow = window.widgetWindows.windowFor(
            this,
            "music keyboard"
        );
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
	widgetWindow.show();

        this._keysLayout();

        var that = this;

        widgetWindow.onclose = function() {
            document.onkeydown = saveOnKeyDown;
            document.onkeyup = saveOnKeyUp;

            if (document.getElementById("keyboardHolder2")) {
                document.getElementById("keyboardHolder2").style.display =
                    "none";
            }

            var myNode = document.getElementById("myrow");
            if (myNode != null) {
                myNode.innerHTML = "";
            }

            var myNode = document.getElementById("myrow2");
            if (myNode != null) {
                myNode.innerHTML = "";
            }

            selected = [];
            selectedNotes = [];

            this.destroy();
        };

        this.playButton = widgetWindow.addButton(
            "play-button.svg",
            ICONSIZE,
            _("Play")
        );

        this.playButton.onclick = function() {
            that._logo.setTurtleDelay(0);
            that.processSelected();
            that.playAll();
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
            that._notesPlayed = [];
            selectedNotes = [];
            // if (!that.keyboardShown) {
            that._createTable();
            // }
        };

        widgetWindow.addButton(
            "add2.svg",
            ICONSIZE,
            _("Add note")
        ).onclick = function() {
            that._createAddRowPieSubmenu();
        };

        // var cell = this._addButton(row1, 'table.svg', ICONSIZE, _('Table'));

        //that._createKeyboard();

        // Append keyboard and div on widget windows
        this.keyboardDiv = document.createElement("div");
        var attr = document.createAttribute("id");
        attr.value = "mkbKeyboardDiv";
        this.keyboardDiv.setAttributeNode(attr);
        this.keyTable = document.createElement("div");
        widgetWindow.getWidgetBody().append(this.keyboardDiv);
        widgetWindow.getWidgetBody().append(this.keyTable);
        widgetWindow.getWidgetBody().style.height = "550px";
        widgetWindow.getWidgetBody().style.width = "1000px";

        this._createKeyboard();

        //var wI = Math.max(Math.min(window.innerWidth, this._cellScale * (OUTERWINDOWWIDTH - 150)), BUTTONDIVWIDTH - BUTTONSIZE);

        this._createTable();

        var w = Math.max(
            Math.min(
                window.innerWidth,
                this._cellScale * OUTERWINDOWWIDTH - 20
            ),
            BUTTONDIVWIDTH
        );

        //Change widget size on fullscreen mode, else
        //revert back to original size on unfullscreen mode
        widgetWindow.onmaximize = function() {
            if (widgetWindow._maximized) {
                widgetWindow.getWidgetBody().style.position = "absolute";
                widgetWindow.getWidgetBody().style.height =
                    "calc(100vh - 64px)";
                widgetWindow.getWidgetBody().style.width = "200vh";
                docById("mkbOuterDiv").style.width = "calc(200vh - 64px)";
                docById("keyboardHolder2").style.width = "calc(200vh - 64px)";
                try {
                    docById("mkbInnerDiv").style.width = "calc(200vh - 200px)";
                } catch (e) {
                    console.debug("Error calculating InnerDiv width");
                }

                widgetWindow.getWidgetBody().style.left = "70px";
            } else {
                widgetWindow.getWidgetBody().style.position = "relative";
                widgetWindow.getWidgetBody().style.left = "0px";
                widgetWindow.getWidgetBody().style.height = "550px";
                widgetWindow.getWidgetBody().style.width = "1000px";
                docById("mkbOuterDiv").style.width = w + "px";
            }
        };

        widgetWindow.sendToCenter();
    };

    this.playAll = function() {
        if (selectedNotes.length <= 0) {
            return;
        }

        this.playingNow = !this.playingNow;
        var playButtonCell = this.playButton;

        if (this.playingNow) {
            playButtonCell.innerHTML =
                '&nbsp;&nbsp;<img src="header-icons/' +
                "stop-button.svg" +
                '" title="' +
                _("stop") +
                '" alt="' +
                _("stop") +
                '" height="' +
                ICONSIZE +
                '" width="' +
                ICONSIZE +
                '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';

            if (selectedNotes.length < 1) {
                return;
            }

            var notes = [];
            for (var i = 0; i < selectedNotes[0].noteOctave.length; i++) {
                if (this.keyboardShown && selectedNotes[0].objId[0] !== null) {
                    var ele = docById(selectedNotes[0].objId[i]);
                    if (ele !== null) {
                        ele.style.backgroundColor = "lightgrey";
                    }
                }

                var zx = selectedNotes[0].noteOctave[i];
                var res = zx;
                if (typeof zx === "string") {
                    res = zx.replace(SHARP, "#").replace(FLAT, "b");
                }

                notes.push(res);
            }

            if (!this.keyboardShown) {
                var cell = docById("cells-0");
                cell.style.backgroundColor = platformColor.selectorBackground;
            }

            this._stopOrCloseClicked = false;
            this._playChord(
                notes,
                selectedNotes[0].duration,
                selectedNotes[0].voice
            );
            var maxWidth = Math.max.apply(Math, selectedNotes[0].duration);
            this.playOne(1, maxWidth, playButtonCell);
        } else {
            if (!this.keyboardShown) {
                this._createTable();
            } else {
                this._createKeyboard();
            }

            this._stopOrCloseClicked = true;
            playButtonCell.innerHTML =
                '&nbsp;&nbsp;<img src="header-icons/' +
                "play-button.svg" +
                '" title="' +
                _("Play") +
                '" alt="' +
                _("Play") +
                '" height="' +
                ICONSIZE +
                '" width="' +
                ICONSIZE +
                '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        }
    };

    this.playOne = function(counter, time, playButtonCell) {
        var that = this;
        setTimeout(function() {
            if (counter < selectedNotes.length) {
                if (that._stopOrCloseClicked) {
                    return;
                }

                if (!that.keyboardShown) {
                    var cell = docById("cells-" + counter);
                    cell.style.backgroundColor =
                        platformColor.selectorBackground;
                }

                if (
                    that.keyboardShown &&
                    selectedNotes[counter - 1].objId[0] !== null
                ) {
                    for (
                        var i = 0;
                        i < selectedNotes[counter - 1].noteOctave.length;
                        i++
                    ) {
                        var eleid = selectedNotes[counter - 1].objId[i];
                        var ele = docById(eleid);
                        if (eleid.includes("blackRow")) {
                            ele.style.backgroundColor = "black";
                        } else {
                            ele.style.backgroundColor = "white";
                        }
                    }
                }

                var notes = [];
                for (
                    var i = 0;
                    i < selectedNotes[counter].noteOctave.length;
                    i++
                ) {
                    if (
                        that.keyboardShown &&
                        selectedNotes[counter].objId[0] !== null
                    ) {
                        var id = that.idContainer.findIndex(function(ele) {
                            return ele[1] === selectedNotes[counter].objId[i];
                        });

                        var ele = docById(selectedNotes[counter].objId[i]);
                        if (ele !== null) {
                            ele.style.backgroundColor = "lightgrey";
                        }
                    }

                    var zx = selectedNotes[counter].noteOctave[i];
                    var res = zx;
                    if (typeof zx === "string") {
                        res = zx.replace(SHARP, "#").replace(FLAT, "b");
                    }
                    notes.push(res);
                }

                if (that.playingNow) {
                    that._playChord(
                        notes,
                        selectedNotes[counter].duration,
                        selectedNotes[counter].voice
                    );
                }

                var maxWidth = Math.max.apply(
                    Math,
                    selectedNotes[counter].duration
                );
                that.playOne(counter + 1, maxWidth, playButtonCell);
            } else {
                playButtonCell.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/' +
                    "play-button.svg" +
                    '" title="' +
                    _("Play") +
                    '" alt="' +
                    _("Play") +
                    '" height="' +
                    ICONSIZE +
                    '" width="' +
                    ICONSIZE +
                    '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
                that.playingNow = false;
                if (!that.keyboardShown) {
                    that._createTable();
                } else {
                    that._createKeyboard();
                }
            }
        }, time * 1000 + 125);
    };

    this._playChord = function(notes, noteValue, instruments) {
        if (notes[0] === "R") {
            return;
        }

        var that = this;
        setTimeout(function() {
            that._logo.synth.trigger(
                0,
                notes[0],
                noteValue[0],
                instruments[0],
                null,
                null
            );
        }, 1);

        if (notes.length > 1) {
            setTimeout(function() {
                that._logo.synth.trigger(
                    0,
                    notes[1],
                    noteValue[0],
                    instruments[1],
                    null,
                    null
                );
            }, 1);
        }

        if (notes.length > 2) {
            setTimeout(function() {
                that._logo.synth.trigger(
                    0,
                    notes[2],
                    noteValue[0],
                    instruments[2],
                    null,
                    null
                );
            }, 1);
        }

        if (notes.length > 3) {
            setTimeout(function() {
                that._logo.synth.trigger(
                    0,
                    notes[3],
                    noteValue[0],
                    instruments[3],
                    null,
                    null
                );
            }, 1);
        }
    };

    this._keysLayout = function() {
        this.layout = [];
        var sortableList = [];
        for (var i = 0; i < this.noteNames.length; i++) {
            if (this.noteNames[i] === "hertz") {
                sortableList.push({
                    frequency: this.octaves[i],
                    noteName: this.noteNames[i],
                    noteOctave: this.octaves[i],
                    blockNumber: this._rowBlocks[i],
                    voice: this.instruments[i]
                });
            } else {
                sortableList.push({
                    frequency: noteToFrequency(
                        this.noteNames[i] + this.octaves[i],
                        this._logo.keySignature[0]
                    ),
                    noteName: this.noteNames[i],
                    noteOctave: this.octaves[i],
                    blockNumber: this._rowBlocks[i],
                    voice: this.instruments[i]
                });
            }
        }

        var sortedList = sortableList.sort(function(a, b) {
            return a.frequency - b.frequency;
        });

        var unique = [];
        this.remove = [];
        var that = this;
        sortedList = sortedList.filter(function(item) {
            if (unique.indexOf(item.noteName + item.noteOctave) === -1) {
                unique.push(item.noteName + item.noteOctave);
                return true;
            }

            that.remove.push(item.blockNumber);
            return false;
        });

        function removeBlock(i) {
            setTimeout(function() {
                that._removePitchBlock(that.remove[i]);
            }, 200);
        }

        for (var i = 0; i < this.remove.length; i++) {
            removeBlock(i);
        }

        for (var i = 0; i < sortedList.length; i++) {
            this.layout.push({
                noteName: sortedList[i].noteName,
                noteOctave: sortedList[i].noteOctave,
                blockNumber: sortedList[i].blockNumber,
                voice: sortedList[i].voice
            });
        }
    };

    this._setNotes = function(colIndex, playNote) {
        var start = docById("cells-" + colIndex).getAttribute("start");

        this._notesPlayed = this._notesPlayed.filter(function(ele) {
            return ele.startTime != parseInt(start);
        });

        // Look for each cell that is marked in this column.
        silence = true;
        for (var j = 0; j < this.layout.length; j++) {
            var row = docById("mkb" + j);
            var cell = row.cells[colIndex];
            if (cell.style.backgroundColor === "black") {
                this._setNoteCell(j, colIndex, start, playNote);
                silence = false;
            }
        }

        if (silence) {
            var ele = docById("cells-" + colIndex);
            var dur = ele.getAttribute("dur");
            this._notesPlayed.push({
                startTime: parseInt(start),
                noteOctave: "R",
                objId: null,
                duration: parseFloat(dur)
            });
            this._notesPlayed.sort(function(a, b) {
                return a.startTime - b.startTime;
            });
        }
    };

    this._setNoteCell = function(j, colIndex, start, playNote) {
        var n = this.layout.length;
        var temp1 = this.layout[n - j - 1].noteName;

        if (temp1 === "hertz") {
            var temp2 = this.layout[n - j - 1].noteOctave;
        } else if (temp1 in FIXEDSOLFEGE1) {
            var temp2 =
                FIXEDSOLFEGE1[temp1].replace(SHARP, "#").replace(FLAT, "b") +
                this.layout[n - j - 1].noteOctave;
        } else {
            var temp2 =
                temp1.replace(SHARP, "#").replace(FLAT, "b") +
                this.layout[n - j - 1].noteOctave;
        }

        var ele = docById(j + ":" + colIndex);
        this._notesPlayed.push({
            startTime: parseInt(start),
            noteOctave: temp2,
            blockNumber: this.layout[n - j - 1].blockNumber,
            duration: parseFloat(ele.getAttribute("alt")),
            objId: this.layout[n - j - 1].objId,
            voice: this.layout[n - j - 1].voice
        });

        this._notesPlayed.sort(function(a, b) {
            return a.startTime - b.startTime;
        });

        if (playNote) {
            this._logo.synth.trigger(
                0,
                temp2,
                ele.getAttribute("alt"),
                this.instruments[0],
                null,
                null
            );
        }
    };

    this.makeClickable = function() {
        var rowNote = docById("mkbNoteDurationRow");
        for (var i = 0; i < selectedNotes.length; i++) {
            var cell = rowNote.cells[i];
            var that = this;
            cell.onclick = function(event) {
                var cell = event.target;
                that._createpiesubmenu(
                    cell.getAttribute("id"),
                    cell.getAttribute("start"),
                    cell.getAttribute("dur")
                );
            };
        }

        for (var i = 0; i < this.layout.length; i++) {
            // The buttons get added to the embedded table.
            var row = docById("mkb" + i);
            for (var j = 0; j < row.cells.length; j++) {
                var cell = row.cells[j];
                // Give each clickable cell a unique id
                cell.setAttribute("id", i + ":" + j);

                var that = this;
                var isMouseDown = false;

                cell.onmousedown = function() {
                    isMouseDown = true;
                    var obj = this.id.split(":");
                    var i = Number(obj[0]);
                    var j = Number(obj[1]);
                    if (this.style.backgroundColor === "black") {
                        this.style.backgroundColor = this.getAttribute(
                            "cellColor"
                        );
                        that._setNotes(j, false);
                    } else {
                        this.style.backgroundColor = "black";
                        that._setNotes(j, true);
                    }
                };

                cell.onmouseover = function() {
                    var obj = this.id.split(":");
                    var i = Number(obj[0]);
                    var j = Number(obj[1]);
                    if (isMouseDown) {
                        if (this.style.backgroundColor === "black") {
                            this.style.backgroundColor = this.getAttribute(
                                "cellColor"
                            );
                            that._setNotes(j, false);
                        } else {
                            this.style.backgroundColor = "black";
                            that._setNotes(j, true);
                        }
                    }
                };

                cell.onmouseup = function() {
                    isMouseDown = false;
                };
            }
        }
    };

    this._noteWidth = function(noteValue) {
        return Math.max(
            Math.floor(EIGHTHNOTEWIDTH * (8 * noteValue) * this._cellScale),
            15
        );
    };

    this._createTable = function() {
        this.processSelected();
        var mkbTableDiv = this.keyTable;
        mkbTableDiv.style.display = "inline";
        mkbTableDiv.style.visibility = "visible";
        mkbTableDiv.style.border = "0px";
        mkbTableDiv.style.width = "700px";

        mkbTableDiv.innerHTML = "";

        mkbTableDiv.innerHTML =
            '<div id="mkbOuterDiv"><div id="mkbInnerDiv"><table cellpadding="0px" id="mkbTable"></table></div></div>';

        var n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 8);

        var outerDiv = docById("mkbOuterDiv");
        if (this.layout.length > n) {
            outerDiv.style.height =
                this._cellScale * MATRIXSOLFEHEIGHT * (n + 5) + "px";
        } else {
            outerDiv.style.height =
                this._cellScale * MATRIXSOLFEHEIGHT * (this.layout.length + 4) +
                "px";
        }

        outerDiv.style.backgroundColor = "white";
        outerDiv.style.marginTop = "15px";

        //var w = Math.max(Math.min(window.innerWidth, this._cellScale * (OUTERWINDOWWIDTH - 150)), BUTTONDIVWIDTH - BUTTONSIZE);
        var innerDiv = docById("mkbInnerDiv");
        innerDiv.style.marginLeft =
            Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + "px";

        var mkbTable = docById("mkbTable");
        if (selectedNotes.length < 1) {
            outerDiv.innerHTML = "";
            return;
        }

        var that = this;
        j = 0;
        var n = this.layout.length;
        for (var i = this.layout.length - 1; i >= 0; i--) {
            var mkbTableRow = mkbTable.insertRow();
            var cell = mkbTableRow.insertCell();
            cell.style.backgroundColor = platformColor.graphicsLabelBackground;
            cell.style.fontSize = this._cellScale * 100 + "%";
            cell.style.height =
                Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
            cell.style.width =
                Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + "px";
            cell.style.minWidth =
                Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + "px";
            cell.style.maxWidth = cell.style.minWidth;
            cell.className = "headcol"; // This cell is fixed horizontally.
            if (this.layout[i].noteName === "hertz") {
                cell.innerHTML = this.layout[i].noteOctave.toString() + "HZ";
            } else {
                cell.innerHTML =
                    i18nSolfege(this.layout[i].noteName) +
                    "<sub>" +
                    this.layout[i].noteOctave.toString() +
                    "</sub>";
            }

            cell.setAttribute("id", "labelcol" + (n - i - 1));
            if (this.layout[i].noteName === "hertz") {
                cell.setAttribute("alt", n - i - 1 + "__" + "synthsblocks");
            } else {
                cell.setAttribute("alt", n - i - 1 + "__" + "pitchblocks");
            }

            cell.onclick = function(event) {
                cell = event.target;
                if (cell.getAttribute("alt") === null) {
                    cell = cell.parentNode;
                }

                var index = cell.getAttribute("alt").split("__")[0];
                var condition = cell.getAttribute("alt").split("__")[1];
                that._createColumnPieSubmenu(index, condition);
            };

            var mkbCell = mkbTableRow.insertCell();
            // Create tables to store individual notes.
            mkbCell.innerHTML =
                '<table cellpadding="0px" id="mkbCellTable' + j + '"></table>';
            var mkbCellTable = docById("mkbCellTable" + j);
            mkbCellTable.style.marginTop = "-1px";

            // We'll use this element to put the clickable notes for this row.
            var mkbRow = mkbCellTable.insertRow();
            mkbRow.setAttribute("id", "mkb" + j);
            j += 1;
        }

        var mkbTableRow = mkbTable.insertRow();
        var cell = mkbTableRow.insertCell();
        cell.style.backgroundColor = platformColor.graphicsLabelBackground;
        cell.style.fontSize = this._cellScale * 100 + "%";
        cell.style.height =
            Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
        cell.style.width =
            Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + "px";
        cell.style.minWidth =
            Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + "px";
        cell.style.maxWidth = cell.style.minWidth;
        cell.className = "headcol"; // This cell is fixed horizontally.
        cell.innerHTML = _("duration");

        var newCell = mkbTableRow.insertCell();
        newCell.innerHTML =
            '<table  class="mkbTable" cellpadding="0px"><tr id="mkbNoteDurationRow"></tr></table>';
        var cellColor = "lightgrey";

        console.debug(selectedNotes);
        for (var j = 0; j < selectedNotes.length; j++) {
            var maxWidth = Math.max.apply(Math, selectedNotes[j].duration);
            var noteMaxWidth =
                this._noteWidth(
                    Math.max.apply(Math, selectedNotes[j].duration)
                ) *
                    2 +
                "px";
            var n = this.layout.length;
            for (var i = 0; i < this.layout.length; i++) {
                var row = docById("mkb" + i);
                var cell = row.insertCell();
                cell.style.height =
                    Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
                cell.style.width = noteMaxWidth;
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;

                if (
                    selectedNotes[j].blockNumber.indexOf(
                        this.layout[n - i - 1].blockNumber
                    ) !== -1
                ) {
                    var ind = selectedNotes[j].blockNumber.indexOf(
                        this.layout[n - i - 1].blockNumber
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

            var dur = toFraction(
                Math.max.apply(Math, selectedNotes[j].duration)
            );
            var row = docById("mkbNoteDurationRow");
            var cell = row.insertCell();
            cell.style.height =
                Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
            cell.style.width = noteMaxWidth;
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.lineHeight = 60 + "%";
            cell.style.textAlign = "center";
            cell.innerHTML = dur[0].toString() + "/" + dur[1].toString();
            cell.setAttribute("id", "cells-" + j);
            cell.setAttribute("start", selectedNotes[j].startTime);
            cell.setAttribute("dur", maxWidth);
            cell.style.backgroundColor = platformColor.rhythmcellcolor;
        }

        var innerDiv = docById("mkbInnerDiv");
        innerDiv.scrollLeft += 3000; // Force to the right.
        this.makeClickable();
    };

    this._createpiesubmenu = function(cellId, start) {
        docById("wheelDivptm").style.display = "";

        this._menuWheel = new wheelnav("wheelDivptm", null, 600, 600);
        this._exitWheel = new wheelnav("_exitWheel", this._menuWheel.raphael);

        this._tabsWheel = new wheelnav("_tabsWheel", this._menuWheel.raphael);
        this._durationWheel = new wheelnav(
            "_durationWheel",
            this._menuWheel.raphael
        );
        this.newNoteValue = 2;
        var mainTabsLabels = [
            "divide",
            "delete",
            "add",
            String(this.newNoteValue)
        ];
        var editDurationLabels = [
            "1/8",
            "1/4",
            "3/8",
            "1/2",
            "5/8",
            "3/4",
            "7/8",
            "1/1"
        ];

        wheelnav.cssMode = true;
        this._menuWheel.keynavigateEnabled = false;
        this._menuWheel.clickModeRotate = false;
        this._menuWheel.colors = platformColor.pitchWheelcolors;
        this._menuWheel.slicePathFunction = slicePath().DonutSlice;
        this._menuWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._menuWheel.sliceSelectedPathCustom = this._menuWheel.slicePathCustom;
        this._menuWheel.sliceInitPathCustom = this._menuWheel.slicePathCustom;
        this._menuWheel.titleRotateAngle = 90;
        this._menuWheel.animatetime = 0; // 300;

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.keynavigateEnabled = false;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;

        var tabsLabels = [
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            ""
        ];
        this._menuWheel.slicePathCustom.minRadiusPercent = 0.2;
        this._menuWheel.slicePathCustom.maxRadiusPercent = 0.5;

        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;

        this._tabsWheel.colors = platformColor.pitchWheelcolors;
        this._tabsWheel.slicePathFunction = slicePath().DonutSlice;
        this._tabsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._tabsWheel.slicePathCustom.minRadiusPercent = 0.5;
        this._tabsWheel.slicePathCustom.maxRadiusPercent = 0.7;
        this._tabsWheel.sliceSelectedPathCustom = this._tabsWheel.slicePathCustom;
        this._tabsWheel.sliceInitPathCustom = this._tabsWheel.slicePathCustom;
        this._tabsWheel.clickModeRotate = false;
        this._tabsWheel.createWheel(tabsLabels);

        this._durationWheel.colors = platformColor.pitchWheelcolors;
        this._durationWheel.keynavigateEnabled = false;
        this._durationWheel.slicePathFunction = slicePath().DonutSlice;
        this._durationWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._durationWheel.slicePathCustom.minRadiusPercent = 0.7;
        this._durationWheel.slicePathCustom.maxRadiusPercent = 1;
        this._durationWheel.sliceSelectedPathCustom = this._durationWheel.slicePathCustom;
        this._durationWheel.sliceInitPathCustom = this._durationWheel.slicePathCustom;
        this._durationWheel.clickModeRotate = false;
        this._durationWheel.createWheel(editDurationLabels);

        for (var i = 0; i < tabsLabels.length; i++) {
            this._tabsWheel.navItems[i].navItem.hide();
        }

        this._menuWheel.createWheel(mainTabsLabels);
        this._exitWheel.createWheel(["x", ""]);

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "250px";
        docById("wheelDivptm").style.width = "250px";

        var x = docById(cellId).getBoundingClientRect().x;
        var y = docById(cellId).getBoundingClientRect().y;

        docById("wheelDivptm").style.left =
            Math.min(
                this._logo.blocks.turtles._canvas.width - 200,
                Math.max(0, x * this._logo.blocks.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                this._logo.blocks.turtles._canvas.height - 250,
                Math.max(0, y * this._logo.blocks.getStageScale())
            ) + "px";

        var that = this;
        this._exitWheel.navItems[0].navigateFunction = function() {
            docById("wheelDivptm").style.display = "none";
            that._menuWheel.removeWheel();
            that._exitWheel.removeWheel();
        };

        var flag = 0;
        this._menuWheel.navItems[0].navigateFunction = function() {
            that._divideNotes(start, that.newNoteValue);
        };

        this._menuWheel.navItems[1].navigateFunction = function() {
            that._deleteNotes(start);
        };

        this._menuWheel.navItems[2].navigateFunction = function() {
            that._addNotes(cellId, start, that.newNoteValue);
        };

        this._menuWheel.navItems[3].navigateFunction = function() {
            if (!flag) {
                for (var i = 12; i < 19; i++) {
                    docById(
                        "wheelnav-wheelDivptm-title-3"
                    ).children[0].textContent = that.newNoteValue;
                    that._tabsWheel.navItems[i].navItem.show();
                }

                flag = 1;
            } else {
                for (var i = 12; i < 19; i++) {
                    docById(
                        "wheelnav-wheelDivptm-title-3"
                    ).children[0].textContent = that.newNoteValue;
                    that._tabsWheel.navItems[i].navItem.hide();
                }

                flag = 0;
            }
        };

        var __selectValue = function() {
            var i = that._durationWheel.selectedNavItemIndex;
            var value = editDurationLabels[i];
            var duration = value.split("/");
            that._updateDuration(start, duration);
        };

        for (var i = 0; i < editDurationLabels.length; i++) {
            this._durationWheel.navItems[i].navigateFunction = __selectValue;
        }

        for (var i = 12; i < 19; i++) {
            this._tabsWheel.navItems[i].navigateFunction = function() {
                var j = that._tabsWheel.selectedNavItemIndex;
                that.newNoteValue = tabsLabels[j];
                docById(
                    "wheelnav-wheelDivptm-title-3"
                ).children[0].textContent = tabsLabels[j];
            };
        }
    };

    this._updateDuration = function(start, duration) {
        start = parseInt(start);
        duration = parseInt(duration[0]) / parseInt(duration[1]);
        var newduration = parseFloat((Math.round(duration * 8) / 8).toFixed(3));
        this._notesPlayed = this._notesPlayed.map(function(item) {
            if (item.startTime === start) {
                item.duration = newduration;
            }

            return item;
        });
        this._createTable();
    };

    this._addNotes = function(cellId, start, divideNoteBy) {
        start = parseInt(start);
        var cell = docById(cellId);
        var dur = cell.getAttribute("dur");

        console.debug(start + " " + dur);

        this._notesPlayed = this._notesPlayed.reduce(function(
            prevValue,
            curValue
        ) {
            if (parseInt(curValue.startTime) === start) {
                prevValue = prevValue.concat([curValue]);
                var oldcurValue = JSON.parse(JSON.stringify(curValue));
                for (var i = 0; i < divideNoteBy; i++) {
                    var newcurValue = JSON.parse(JSON.stringify(oldcurValue));
                    newcurValue.startTime =
                        oldcurValue.startTime + oldcurValue.duration * 1000;
                    prevValue = prevValue.concat([newcurValue]);
                    oldcurValue = newcurValue;
                }

                return prevValue;
            } else if (parseInt(curValue.startTime) > start) {
                curValue.startTime =
                    curValue.startTime + dur * 1000 * divideNoteBy;
                return prevValue.concat([curValue]);
            }

            return prevValue.concat([curValue]);
        },
        []);

        this._createTable();
    };

    this._deleteNotes = function(start) {
        start = parseInt(start);

        this._notesPlayed = this._notesPlayed.filter(function(ele) {
            return parseInt(ele.startTime) !== start;
        });

        this._createTable();
    };

    this._divideNotes = function(start, divideNoteBy) {
        start = parseInt(start);

        this._notesPlayed = this._notesPlayed.reduce(function(
            prevValue,
            curValue
        ) {
            if (parseInt(curValue.startTime) === start) {
                if (beginnerMode === "true") {
                    if (curValue.duration / divideNoteBy < 0.125) {
                        return prevValue.concat([curValue]);
                    }
                } else {
                    if (curValue.duration / divideNoteBy < 0.0625) {
                        return prevValue.concat([curValue]);
                    }
                }

                var newcurValue = JSON.parse(JSON.stringify(curValue));
                newcurValue.duration = curValue.duration / divideNoteBy;
                prevValue = prevValue.concat([newcurValue]);
                var oldcurValue = newcurValue;
                for (var i = 0; i < divideNoteBy - 1; i++) {
                    var newcurValue2 = JSON.parse(JSON.stringify(oldcurValue));
                    newcurValue2.startTime = parseInt(
                        newcurValue2.startTime + newcurValue2.duration * 1000
                    );
                    prevValue = prevValue.concat([newcurValue2]);
                    oldcurValue = newcurValue2;
                }

                return prevValue;
            }

            return prevValue.concat([curValue]);
        },
        []);

        this._createTable();
    };

    this._createAddRowPieSubmenu = function() {
        docById("wheelDivptm").style.display = "";
        docById("wheelDivptm").style.zIndex = "300";
        var pitchLabels = ["do", "re", "mi", "fa", "sol", "la", "ti"];
        var hertzLabels = [261, 294, 327, 348, 392, 436, 490, 523];
        const VALUESLABEL = ["pitch", "hertz"];
        const VALUES = ["imgsrc: images/chime.svg", "imgsrc: images/synth.svg"];
        var valueLabel = [];
        for (var i = 0; i < VALUES.length; i++) {
            var label = _(VALUES[i]);
            valueLabel.push(label);
        }

        this._menuWheel = new wheelnav("wheelDivptm", null, 200, 200);
        this._exitWheel = new wheelnav("_exitWheel", this._menuWheel.raphael);

        wheelnav.cssMode = true;

        this._menuWheel.keynavigateEnabled = false;
        this._menuWheel.slicePathFunction = slicePath().DonutSlice;
        this._menuWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._menuWheel.colors = [
            platformColor.paletteColors["pitch"][0],
            platformColor.paletteColors["pitch"][1]
        ];
        this._menuWheel.slicePathCustom.minRadiusPercent = 0.3;
        this._menuWheel.slicePathCustom.maxRadiusPercent = 1.0;

        this._menuWheel.sliceSelectedPathCustom = this._menuWheel.slicePathCustom;
        this._menuWheel.sliceInitPathCustom = this._menuWheel.slicePathCustom;
        this._menuWheel.clickModeRotate = false;

        this._menuWheel.animatetime = 0; // 300;
        this._menuWheel.createWheel(valueLabel);
        this._menuWheel.navItems[0].setTooltip(_("pitch"));
        this._menuWheel.navItems[1].setTooltip(_("hertz"));

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.25;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["x", " "]);

        var x = docById("addnotes").getBoundingClientRect().x;
        var y = docById("addnotes").getBoundingClientRect().y;

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "300px";
        docById("wheelDivptm").style.width = "300px";
        docById("wheelDivptm").style.left =
            Math.min(
                this._logo.blocks.turtles._canvas.width - 200,
                Math.max(0, x * this._logo.blocks.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                this._logo.blocks.turtles._canvas.height - 250,
                Math.max(0, y * this._logo.blocks.getStageScale())
            ) + "px";

        var that = this;
        this._exitWheel.navItems[0].navigateFunction = function() {
            docById("wheelDivptm").style.display = "none";
            that._menuWheel.removeWheel();
            that._exitWheel.removeWheel();
        };

        var __selectionChanged = function() {
            var label = VALUESLABEL[that._menuWheel.selectedNavItemIndex];
            var newBlock = that._logo.blocks.blockList.length;
            if (label === "pitch") {
                for (var i = 0; i < pitchLabels.length; i++) {
                    if (
                        pitchLabels[i].indexOf(last(that.layout).noteName) !==
                            -1 ||
                        last(that.layout).noteName.indexOf(pitchLabels[i]) !==
                            -1
                    ) {
                        break;
                    }
                }

                var rLabel = pitchLabels[(i + 1) % pitchLabels.length];
                var rArg = last(that.layout).noteOctave;
                if ((i + 1) % pitchLabels.length === 0) {
                    rArg += 1;
                }
            } else {
                var rLabel = "hertz";
                var rArg = 392;
                var flag = false;
                for (var i = 0; i < hertzLabels.length; i++) {
                    flag = false;
                    for (var j = 0; j < that.layout.length; j++) {
                        if (that.layout[j].noteName === "hertz") {
                            if (that.layout[j].noteOctave === hertzLabels[i]) {
                                flag = true;
                                break;
                            }
                        }
                    }

                    if (flag) {
                        continue;
                    }

                    rArg = hertzLabels[i];
                    break;
                }
            }

            switch (label) {
                case "pitch":
                    that._logo.blocks.loadNewBlocks([
                        [0, ["pitch", {}], 0, 0, [null, 1, 2, null]],
                        [1, ["solfege", { value: rLabel }], 0, 0, [0]],
                        [2, ["number", { value: rArg }], 0, 0, [0]]
                    ]);
                    break;
                case "hertz":
                    that._logo.blocks.loadNewBlocks([
                        [0, ["hertz", {}], 0, 0, [null, 1, null]],
                        [1, ["number", { value: rArg }], 0, 0, [0]]
                    ]);
                    break;
            }

            var aboveBlock = last(that.layout).blockNumber;
            setTimeout(that._addNotesBlockBetween(aboveBlock, newBlock), 500);
            that.layout.push({
                noteName: rLabel,
                noteOctave: rArg,
                blockNumber: newBlock,
                voice: last(that.layout).voice
            });
            that._sortLayout();
            that._createTable();
        };

        for (var i = 0; i < valueLabel.length; i++) {
            this._menuWheel.navItems[i].navigateFunction = __selectionChanged;
        }
    };

    this._addNotesBlockBetween = function(aboveBlock, block) {
        var belowBlock = last(
            this._logo.blocks.blockList[aboveBlock].connections
        );
        this._logo.blocks.blockList[aboveBlock].connections[
            this._logo.blocks.blockList[aboveBlock].connections.length - 1
        ] = block;
        if (belowBlock !== null) {
            this._logo.blocks.blockList[belowBlock].connections[0] = block;
        }

        this._logo.blocks.blockList[block].connections[0] = aboveBlock;
        this._logo.blocks.blockList[block].connections[
            this._logo.blocks.blockList[block].connections.length - 1
        ] = belowBlock;
        this._logo.blocks.adjustDocks(this.blockNo, true);
        this._logo.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        this._logo.blocks.refreshCanvas();
    };

    this._sortLayout = function() {
        var that = this;
        this.layout.sort(function(a, b) {
            var aValue, bValue;
            if (a.noteName == "hertz") {
                aValue = a.noteOctave;
            } else {
                aValue = noteToFrequency(
                    a.noteName + a.noteOctave,
                    that._logo.keySignature[0]
                );
            }
            if (b.noteName == "hertz") {
                bValue = b.noteOctave;
            } else {
                bValue = noteToFrequency(
                    b.noteName + b.noteOctave,
                    that._logo.keySignature[0]
                );
            }

            return aValue - bValue;
        });

        var unique = [];
        this.remove = [];
        this.layout = this.layout.filter(function(item, pos) {
            if (unique.indexOf(item.noteName + item.noteOctave) === -1) {
                unique.push(item.noteName + item.noteOctave);
                return true;
            }

            that.remove = [
                that.layout[pos - 1].blockNumber,
                that.layout[pos].blockNumber
            ];
            return false;
        });

        this._notesPlayed.map(function(item) {
            if (item.objId === that.remove[1]) {
                item.objId = that.remove[0];
            }

            return item;
        });

        if (this.remove.length) {
            this._removePitchBlock(this.remove[1]);
        }

        if (that.keyboardShown) {
            that._createKeyboard();
        } else {
            that._createTable();
        }
    };

    this._removePitchBlock = function(blockNo) {
        var c0 = this._logo.blocks.blockList[blockNo].connections[0];
        var c1 = last(this._logo.blocks.blockList[blockNo].connections);
        if (this._logo.blocks.blockList[c0].name === "musickeyboard") {
            this._logo.blocks.blockList[c0].connections[1] = c1;
        } else {
            this._logo.blocks.blockList[c0].connections[
                this._logo.blocks.blockList[c0].connections.length - 1
            ] = c1;
        }

        if (c1) {
            this._logo.blocks.blockList[c1].connections[0] = c0;
        }

        this._logo.blocks.blockList[blockNo].connections[
            this._logo.blocks.blockList[blockNo].connections.length - 1
        ] = null;
        this._logo.blocks.sendStackToTrash(
            this._logo.blocks.blockList[blockNo]
        );
        this._logo.blocks.adjustDocks(this.blockNo, true);
        this._logo.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        this._logo.blocks.refreshCanvas();
    };

    this._createColumnPieSubmenu = function(index, condition) {
        index = parseInt(index);
        docById("wheelDivptm").style.display = "";
        docById("wheelDivptm").style.zIndex = "300";

        var accidentals = ["𝄪", "♯", "♮", "♭", "𝄫"];
        var noteLabels = ["ti", "la", "sol", "fa", "mi", "re", "do"];
        var noteLabelsI18n = [];
        for (var i = 0; i < noteLabels.length; i++) {
            noteLabelsI18n.push(i18nSolfege(noteLabels[i]));
        }

        if (condition === "synthsblocks") {
            var noteLabels = [
                "261",
                "294",
                "327",
                "348",
                "392",
                "436",
                "490",
                "523"
            ];
        }

        this._pitchWheel = new wheelnav("wheelDivptm", null, 600, 600);

        this._exitWheel = new wheelnav("_exitWheel", this._pitchWheel.raphael);
        if (condition === "pitchblocks") {
            this._accidentalsWheel = new wheelnav(
                "_accidentalsWheel",
                this._pitchWheel.raphael
            );
            this._octavesWheel = new wheelnav(
                "_octavesWheel",
                this._pitchWheel.raphael
            );
        }

        wheelnav.cssMode = true;

        this._pitchWheel.keynavigateEnabled = false;
        this._pitchWheel.slicePathFunction = slicePath().DonutSlice;
        this._pitchWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        if (condition === "pitchblocks") {
            this._pitchWheel.colors = platformColor.pitchWheelcolors;
            this._pitchWheel.slicePathCustom.minRadiusPercent = 0.2;
            this._pitchWheel.slicePathCustom.maxRadiusPercent = 0.5;
        } else if (condition === "synthsblocks") {
            this._pitchWheel.titleRotateAngle = 0;
            this._pitchWheel.colors = platformColor.blockLabelsWheelcolors;
            this._pitchWheel.slicePathCustom.minRadiusPercent = 0.6;
            this._pitchWheel.slicePathCustom.maxRadiusPercent = 1;
            this._pitchWheel.titleRotateAngle = 90;
            this._pitchWheel.clickModeRotate = false;
        }

        this._pitchWheel.sliceSelectedPathCustom = this._pitchWheel.slicePathCustom;
        this._pitchWheel.sliceInitPathCustom = this._pitchWheel.slicePathCustom;

        this._pitchWheel.animatetime = 0; // 300;
        if (condition === "synthsblocks") {
            this._pitchWheel.createWheel(noteLabels);
        } else {
            this._pitchWheel.createWheel(noteLabelsI18n);
        }

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["x", " "]);

        if (condition === "pitchblocks") {
            this._accidentalsWheel.colors =
                platformColor.accidentalsWheelcolors;
            this._accidentalsWheel.slicePathFunction = slicePath().DonutSlice;
            this._accidentalsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._accidentalsWheel.slicePathCustom.minRadiusPercent = 0.5;
            this._accidentalsWheel.slicePathCustom.maxRadiusPercent = 0.75;
            this._accidentalsWheel.sliceSelectedPathCustom = this._accidentalsWheel.slicePathCustom;
            this._accidentalsWheel.sliceInitPathCustom = this._accidentalsWheel.slicePathCustom;

            var accidentalLabels = [];
            for (var i = 0; i < accidentals.length; i++) {
                accidentalLabels.push(accidentals[i]);
            }

            for (var i = 0; i < 9; i++) {
                accidentalLabels.push(null);
                this._accidentalsWheel.colors.push(
                    platformColor.accidentalsWheelcolorspush
                );
            }

            this._accidentalsWheel.animatetime = 0; // 300;
            this._accidentalsWheel.createWheel(accidentalLabels);
            this._accidentalsWheel.setTooltips([
                _("double sharp"),
                _("sharp"),
                _("natural"),
                _("flat"),
                _("double flat")
            ]);

            this._octavesWheel.colors = platformColor.octavesWheelcolors;
            this._octavesWheel.slicePathFunction = slicePath().DonutSlice;
            this._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._octavesWheel.slicePathCustom.minRadiusPercent = 0.75;
            this._octavesWheel.slicePathCustom.maxRadiusPercent = 0.95;
            this._octavesWheel.sliceSelectedPathCustom = this._octavesWheel.slicePathCustom;
            this._octavesWheel.sliceInitPathCustom = this._octavesWheel.slicePathCustom;
            var octaveLabels = [
                "8",
                "7",
                "6",
                "5",
                "4",
                "3",
                "2",
                "1",
                null,
                null,
                null,
                null,
                null,
                null
            ];
            this._octavesWheel.animatetime = 0; // 300;
            this._octavesWheel.createWheel(octaveLabels);
        }

        var x = docById("labelcol" + index).getBoundingClientRect().x;
        var y = docById("labelcol" + index).getBoundingClientRect().y;

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "300px";
        docById("wheelDivptm").style.width = "300px";
        docById("wheelDivptm").style.left =
            Math.min(
                this._logo.blocks.turtles._canvas.width - 200,
                Math.max(0, x * this._logo.blocks.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                this._logo.blocks.turtles._canvas.height - 250,
                Math.max(0, y * this._logo.blocks.getStageScale())
            ) + "px";

        index = this.layout.length - index - 1;
        var block = this.layout[index].blockNumber;
        var noteValue = this._logo.blocks.blockList[
            this._logo.blocks.blockList[block].connections[1]
        ].value;

        if (condition === "pitchblocks") {
            var octaveValue = this._logo.blocks.blockList[
                this._logo.blocks.blockList[block].connections[2]
            ].value;
            var accidentalsValue = 2;

            for (var i = 0; i < accidentals.length; i++) {
                if (noteValue.indexOf(accidentals[i]) !== -1) {
                    accidentalsValue = i;
                    noteValue = noteValue.substr(
                        0,
                        noteValue.indexOf(accidentals[i])
                    );
                    break;
                }
            }

            this._accidentalsWheel.navigateWheel(accidentalsValue);
            this._octavesWheel.navigateWheel(
                octaveLabels.indexOf(octaveValue.toString())
            );
            console.debug(noteValue);
            this._pitchWheel.navigateWheel(noteLabels.indexOf(noteValue));
        }

        var that = this;
        this._exitWheel.navItems[0].navigateFunction = function() {
            docById("wheelDivptm").style.display = "none";
            that._pitchWheel.removeWheel();
            that._exitWheel.removeWheel();
            if (condition === "pitchblocks") {
                that._accidentalsWheel.removeWheel();
                that._octavesWheel.removeWheel();
            }

            that._sortLayout();
        };

        var __hertzSelectionChanged = function() {
            blockValue =
                that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex]
                    .title;
            var argBlock = that._logo.blocks.blockList[block].connections[1];
            that._logo.blocks.blockList[argBlock].text.text = blockValue;
            that._logo.blocks.blockList[argBlock].value = parseInt(blockValue);

            var z =
                that._logo.blocks.blockList[argBlock].container.children
                    .length - 1;
            that._logo.blocks.blockList[argBlock].container.setChildIndex(
                that._logo.blocks.blockList[argBlock].text,
                z
            );
            that._logo.blocks.blockList[argBlock].updateCache();

            var cell = docById("labelcol" + (that.layout.length - index - 1));
            that.layout[index].noteOctave = parseInt(blockValue);
            cell.innerHTML =
                that.layout[index].noteName +
                that.layout[index].noteOctave.toString();
            that._notesPlayed.map(function(item) {
                if (item.objId == that.layout[index].blockNumber) {
                    item.noteOctave = parseInt(blockValue);
                }
                return item;
            });
        };

        if (condition === "synthsblocks") {
            for (var i = 0; i < noteLabels.length; i++) {
                this._pitchWheel.navItems[
                    i
                ].navigateFunction = __hertzSelectionChanged;
            }
        }

        var __selectionChanged = function() {
            var label =
                that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex]
                    .title;
            if (condition === "pitchblocks") {
                var i = noteLabelsI18n.indexOf(label);
                var labelValue = noteLabels[i];
                console.debug(label);
                console.debug(labelValue);
                var attr =
                    that._accidentalsWheel.navItems[
                        that._accidentalsWheel.selectedNavItemIndex
                    ].title;
                var flag = false;
                if (attr !== "♮") {
                    label += attr;
                    flag = true;
                }
            } else {
                var i = noteLabels.indexOf(label);
                var labelValue = label;
            }

            var noteLabelBlock =
                that._logo.blocks.blockList[block].connections[1];
            that._logo.blocks.blockList[noteLabelBlock].text.text = label;
            that._logo.blocks.blockList[noteLabelBlock].value = labelValue;

            var z =
                that._logo.blocks.blockList[noteLabelBlock].container.children
                    .length - 1;
            that._logo.blocks.blockList[noteLabelBlock].container.setChildIndex(
                that._logo.blocks.blockList[noteLabelBlock].text,
                z
            );
            that._logo.blocks.blockList[noteLabelBlock].updateCache();
            if (condition === "pitchblocks") {
                var octave = Number(
                    that._octavesWheel.navItems[
                        that._octavesWheel.selectedNavItemIndex
                    ].title
                );
                that._logo.blocks.blockList[
                    noteLabelBlock
                ].blocks.setPitchOctave(
                    that._logo.blocks.blockList[noteLabelBlock].connections[0],
                    octave
                );
            }

            var cell = docById("labelcol" + (that.layout.length - index - 1));
            that.layout[index].noteName = label;
            that.layout[index].noteOctave = octave;
            cell.innerHTML =
                that.layout[index].noteName +
                that.layout[index].noteOctave.toString();
            var temp1 = label;
            if (temp1 in FIXEDSOLFEGE1) {
                var temp2 =
                    FIXEDSOLFEGE1[temp1]
                        .replace(SHARP, "#")
                        .replace(FLAT, "b") + octave;
            } else {
                var temp2 =
                    temp1.replace(SHARP, "#").replace(FLAT, "b") + octave;
            }

            that._notesPlayed.map(function(item) {
                if (item.objId == that.layout[index].blockNumber) {
                    item.noteOctave = temp2;
                }
                return item;
            });
        };

        var __pitchPreview = function() {
            var label =
                that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex]
                    .title;
            var i = noteLabelsI18n.indexOf(label);
            var labelValue = noteLabels[i];

            var attr =
                that._accidentalsWheel.navItems[
                    that._accidentalsWheel.selectedNavItemIndex
                ].title;
            if (attr !== "♮") {
                labelValue += attr;
            }

            var octave = Number(
                that._octavesWheel.navItems[
                    that._octavesWheel.selectedNavItemIndex
                ].title
            );
            var obj = getNote(
                labelValue,
                octave,
                0,
                that._logo.keySignature[0],
                false,
                null,
                that._logo.errorMsg,
                that._logo.synth.inTemperament
            );
            that._logo.synth.setMasterVolume(PREVIEWVOLUME);
            that._logo.setSynthVolume(0, DEFAULTVOICE, PREVIEWVOLUME);
            that._logo.synth.trigger(
                0,
                [obj[0] + obj[1]],
                1 / 8,
                DEFAULTVOICE,
                null,
                null
            );

            __selectionChanged();
        };

        if (condition === "pitchblocks") {
            for (var i = 0; i < noteLabels.length; i++) {
                this._pitchWheel.navItems[i].navigateFunction = __pitchPreview;
            }

            for (var i = 0; i < accidentals.length; i++) {
                this._accidentalsWheel.navItems[
                    i
                ].navigateFunction = __pitchPreview;
            }

            for (var i = 0; i < 8; i++) {
                this._octavesWheel.navItems[
                    i
                ].navigateFunction = __pitchPreview;
            }
        }
    };

    this._createKeyboard = function() {
        document.onkeydown = null;
        var mkbKeyboardDiv = this.keyboardDiv;
        mkbKeyboardDiv.style.display = "inline";
        mkbKeyboardDiv.style.visibility = "visible";
        mkbKeyboardDiv.style.border = "0px";
        mkbKeyboardDiv.style.width = "300px";
        mkbKeyboardDiv.style.top = "0px";
        mkbKeyboardDiv.innerHTML = "";

        mkbKeyboardDiv.innerHTML =
            ' <div id="keyboardHolder2"><table class="white"><tbody><tr id="myrow"></tr></tbody></table><table class="black"><tbody><tr id="myrow2"></tr></tbody></table></div>';

        var keyboardHolder2 = docById("keyboardHolder2");
        keyboardHolder2.style.bottom = "10px";
        keyboardHolder2.style.left = "0px";
        keyboardHolder2.style.height = "145px";
        keyboardHolder2.style.backgroundColor = "white";

        var blackRow = document.getElementsByClassName("black");
        blackRow[0].style.top = "1px";
        blackRow[0].style.borderSpacing = "0px 0px 20px";
        blackRow[0].style.borderCollapse = "separate";

        var myNode = document.getElementById("myrow");
        myNode.innerHTML = "";
        var myNode = document.getElementById("myrow2");
        myNode.innerHTML = "";

        // For the button callbacks
        var that = this;
        if (this.noteNames.length === 0) {
            for (var i = 0; i < PITCHES3.length; i++) {
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

        document.getElementById("keyboardHolder2").style.display = "block";
        that.idContainer = [];
        var myrowId = 0;
        var myrow2Id = 0;

        for (var p = 0; p < this.layout.length; p++) {
            if (this.layout[p].noteName === null) {
                var parenttbl2 = document.getElementById("myrow2");
                var newel2 = document.createElement("td");
                newel2.setAttribute("id", "blackRow" + myrow2Id.toString());
                if ([2, 6, 9, 13, 16, 20].indexOf(myrow2Id) !== -1) {
                    parenttbl2.appendChild(newel2);
                    var el = docById("blackRow" + myrow2Id.toString());
                    el.style.background = "transparent";
                    el.style.border = "none";
                    el.style.zIndex = "10";
                    el.style.position = "relative";
                    p--;
                    myrow2Id++;
                    continue;
                }

                newel2.setAttribute(
                    "alt",
                    this.layout[p].noteName +
                        "__" +
                        this.layout[p].noteOctave +
                        "__" +
                        this.layout[p].blockNumber
                );
                that.idContainer.push([
                    "blackRow" + myrow2Id.toString(),
                    this.layout[p].blockNumber
                ]);

                this.layout[p].objId = "blackRow" + myrow2Id.toString();

                myrow2Id++;
                newel2.innerHTML = "";
                newel2.style.visibility = "hidden";
                parenttbl2.appendChild(newel2);
            } else if (this.layout[p].noteName === "hertz") {
                var parenttbl = document.getElementById("myrow");
                var newel = document.createElement("td");
                newel.style.textAlign = "center";
                newel.setAttribute("id", "whiteRow" + myrowId.toString());
                newel.setAttribute(
                    "alt",
                    this.layout[p].noteName +
                        "__" +
                        this.layout[p].noteOctave +
                        "__" +
                        this.layout[p].blockNumber
                );
                that.idContainer.push([
                    "whiteRow" + myrowId.toString(),
                    this.layout[p].blockNumber
                ]);
                newel.innerHTML =
                    "<small>(" +
                    String.fromCharCode(WHITEKEYS[myrowId]) +
                    ")</small><br/>" +
                    this.layout[p].noteOctave;

                this.layout[p].objId = "whiteRow" + myrowId.toString();

                myrowId++;
                newel.style.position = "relative";
                newel.style.zIndex = "100";
                parenttbl.appendChild(newel);
            } else if (
                this.layout[p].noteName.indexOf(SHARP) !== -1 ||
                this.layout[p].noteName.indexOf("#") !== -1
            ) {
                var parenttbl2 = document.getElementById("myrow2");
                var newel2 = document.createElement("td");
                newel2.setAttribute("id", "blackRow" + myrow2Id.toString());
                newel2.style.textAlign = "center";
                if ([2, 6, 9, 13, 16, 20].indexOf(myrow2Id) !== -1) {
                    parenttbl2.appendChild(newel2);
                    var el = docById("blackRow" + myrow2Id.toString());
                    el.style.background = "transparent";
                    el.style.border = "none";
                    el.style.zIndex = "10";
                    el.style.position = "relative";
                    p--;
                    myrow2Id++;
                    continue;
                }

                newel2.setAttribute(
                    "alt",
                    this.layout[p].noteName +
                        "__" +
                        this.layout[p].noteOctave +
                        "__" +
                        this.layout[p].blockNumber
                );
                that.idContainer.push([
                    "blackRow" + myrow2Id.toString(),
                    this.layout[p].blockNumber
                ]);

                var nname = this.layout[p].noteName
                    .replace(SHARP, "")
                    .replace("#", "");
                if (SOLFEGENAMES.indexOf(nname) !== -1) {
                    newel2.innerHTML =
                        "<small>(" +
                        String.fromCharCode(BLACKKEYS[myrow2Id]) +
                        ")</small><br/>" +
                        i18nSolfege(nname) +
                        SHARP +
                        this.layout[p].noteOctave;
                } else {
                    newel2.innerHTML =
                        "<small>(" +
                        String.fromCharCode(BLACKKEYS[myrow2Id]) +
                        ")</small><br/>" +
                        this.layout[p].noteName +
                        this.layout[p].noteOctave;
                }

                this.layout[p].objId = "blackRow" + myrow2Id.toString();

                myrow2Id++;
                newel2.style.position = "relative";
                newel2.style.zIndex = "200";
                parenttbl2.appendChild(newel2);
            } else if (
                this.layout[p].noteName.indexOf(FLAT) !== -1 ||
                this.layout[p].noteName.indexOf("b") !== -1
            ) {
                var parenttbl2 = document.getElementById("myrow2");
                var newel2 = document.createElement("td");
                var elementid2 = document.getElementsByTagName("td").length;
                newel2.setAttribute("id", "blackRow" + myrow2Id.toString());
                newel2.style.textAlign = "center";
                if ([2, 6, 9, 13, 16, 20].indexOf(myrow2Id) !== -1) {
                    parenttbl2.appendChild(newel2);
                    var el = docById("blackRow" + myrow2Id.toString());
                    el.style.background = "transparent";
                    el.style.border = "none";
                    el.style.zIndex = "10";
                    el.style.position = "relative";
                    p--;
                    myrow2Id++;
                    continue;
                }

                newel2.setAttribute(
                    "alt",
                    this.layout[p].noteName +
                        "__" +
                        this.layout[p].noteOctave +
                        "__" +
                        this.layout[p].blockNumber
                );
                that.idContainer.push([
                    "blackRow" + myrow2Id.toString(),
                    this.layout[p].blockNumber
                ]);
                var nname = this.layout[p].noteName
                    .replace(FLAT, "")
                    .replace("b", "");
                if (SOLFEGENAMES.indexOf(nname) !== -1) {
                    newel2.innerHTML =
                        "<small>(" +
                        String.fromCharCode(BLACKKEYS[myrow2Id]) +
                        ")</small><br/>" +
                        i18nSolfege(nname) +
                        FLAT +
                        this.layout[p].noteOctave;
                } else {
                    newel2.innerHTML =
                        "<small>(" +
                        String.fromCharCode(BLACKKEYS[myrow2Id]) +
                        ")</small><br/>" +
                        this.layout[p].noteName +
                        this.layout[p].noteOctave;
                }

                this.layout[p].objId = "blackRow" + myrow2Id.toString();

                myrow2Id++;
                newel2.style.position = "relative";
                newel2.style.zIndex = "200";
                parenttbl2.appendChild(newel2);
            } else {
                var parenttbl = document.getElementById("myrow");
                var newel = document.createElement("td");
                var elementid = document.getElementsByTagName("td").length;

                newel.setAttribute("id", "whiteRow" + myrowId.toString());
                newel.style.textAlign = "center";
                newel.setAttribute(
                    "alt",
                    this.layout[p].noteName +
                        "__" +
                        this.layout[p].noteOctave +
                        "__" +
                        this.layout[p].blockNumber
                );
                that.idContainer.push([
                    "whiteRow" + myrowId.toString(),
                    this.layout[p].blockNumber
                ]);

                if (SOLFEGENAMES.indexOf(this.layout[p].noteName) !== -1) {
                    newel.innerHTML =
                        "<small>(" +
                        String.fromCharCode(WHITEKEYS[myrowId]) +
                        ")</small><br/>" +
                        i18nSolfege(this.layout[p].noteName) +
                        this.layout[p].noteOctave;
                } else {
                    newel.innerHTML =
                        "<small>(" +
                        String.fromCharCode(WHITEKEYS[myrowId]) +
                        ")</small><br/>" +
                        this.layout[p].noteName +
                        this.layout[p].noteOctave;
                }

                this.layout[p].objId = "whiteRow" + myrowId.toString();

                myrowId++;
                newel.style.position = "relative";
                newel.style.zIndex = "100";
                parenttbl.appendChild(newel);
            }
        }

        for (var i = 0; i < that.idContainer.length; i++) {
            this.loadHandler(
                document.getElementById(that.idContainer[i][0]),
                i,
                that.idContainer[i][1]
            );
        }

        this.addKeyboardShortcuts();
    };

    this._save = function() {
        this.processSelected();
        console.debug("Generating action stack for: " + selectedNotes);
        var newStack = [
            [
                0,
                ["action", { collapsed: false }],
                100,
                100,
                [null, 1, null, null]
            ],
            [1, ["text", { value: _("action") }], 0, 0, [0]]
        ];
        var endOfStackIdx = 0;

        for (var i = 0; i < selectedNotes.length; i++) {
            note = selectedNotes[i];

            // Add the Note block and its value
            var idx = newStack.length;
            newStack.push([
                idx,
                "newnote",
                0,
                0,
                [endOfStackIdx, idx + 2, idx + 1, null]
            ]);
            var n = newStack[idx][4].length;
            if (i === 0) {
                // the action block
                newStack[endOfStackIdx][4][n - 2] = idx;
            } else {
                // the previous note block
                newStack[endOfStackIdx][4][n - 1] = idx;
            }

            var endOfStackIdx = idx;

            var delta = 5;

            // Add a vspace to prevent divide block from obscuring the pitch block.
            newStack.push([idx + 1, "vspace", 0, 0, [idx, idx + delta]]);

            // note value is saved as a fraction
            newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);
            var maxWidth = Math.max.apply(Math, note.duration);

            var obj = toFraction(maxWidth);
            newStack.push([
                idx + 3,
                ["number", { value: obj[0] }],
                0,
                0,
                [idx + 2]
            ]);
            newStack.push([
                idx + 4,
                ["number", { value: obj[1] }],
                0,
                0,
                [idx + 2]
            ]);

            var thisBlock = idx + delta;

            // We need to point to the previous note or pitch block.
            var previousBlock = idx + 1; // Note block

            // The last connection in last pitch block is null.
            var lastConnection = null;

            if (note.noteOctave[0] === "R") {
                newStack.push([
                    thisBlock + 1,
                    "rest2",
                    0,
                    0,
                    [previousBlock, lastConnection]
                ]);
            } else {
                for (var j = 0; j < note.noteOctave.length; j++) {
                    if (j > 0) {
                        if (typeof note.noteOctave[j - 1] === "string") {
                            thisBlock = previousBlock + 3;
                        } else {
                            thisBlock = previousBlock + 2;
                        }
                        var n = newStack[previousBlock][4].length;
                        newStack[previousBlock][4][n - 1] = thisBlock;
                    }
                    if (typeof note.noteOctave[j] === "string") {
                        newStack.push([
                            thisBlock,
                            "pitch",
                            0,
                            0,
                            [
                                previousBlock,
                                thisBlock + 1,
                                thisBlock + 2,
                                lastConnection
                            ]
                        ]);
                        if (
                            ["#", "b", "♯", "♭"].indexOf(
                                note.noteOctave[j][1]
                            ) !== -1
                        ) {
                            newStack.push([
                                thisBlock + 1,
                                [
                                    "solfege",
                                    {
                                        value:
                                            SOLFEGECONVERSIONTABLE[
                                                note.noteOctave[j][0]
                                            ] + note.noteOctave[j][1]
                                    }
                                ],
                                0,
                                0,
                                [thisBlock]
                            ]);
                            newStack.push([
                                thisBlock + 2,
                                [
                                    "number",
                                    {
                                        value:
                                            note.noteOctave[j][
                                                note.noteOctave[j].length - 1
                                            ]
                                    }
                                ],
                                0,
                                0,
                                [thisBlock]
                            ]);
                        } else {
                            newStack.push([
                                thisBlock + 1,
                                [
                                    "solfege",
                                    {
                                        value:
                                            SOLFEGECONVERSIONTABLE[
                                                note.noteOctave[j][0]
                                            ]
                                    }
                                ],
                                0,
                                0,
                                [thisBlock]
                            ]);
                            newStack.push([
                                thisBlock + 2,
                                [
                                    "number",
                                    {
                                        value:
                                            note.noteOctave[j][
                                                note.noteOctave[j].length - 1
                                            ]
                                    }
                                ],
                                0,
                                0,
                                [thisBlock]
                            ]);
                        }
                    } else {
                        newStack.push([
                            thisBlock,
                            "hertz",
                            0,
                            0,
                            [previousBlock, thisBlock + 1, lastConnection]
                        ]);
                        newStack.push([
                            thisBlock + 1,
                            ["number", { value: note.noteOctave[j] }],
                            0,
                            0,
                            [thisBlock]
                        ]);
                    }
                    previousBlock = thisBlock;
                }
            }
        }
        this._logo.blocks.loadNewBlocks(newStack);
        this._logo.textMsg(_("New action block generated!"));
    };

    this.clearBlocks = function() {
        this.noteNames = [];
        this.octaves = [];
    };

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
}
