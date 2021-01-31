/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// Copyright (c) 2015 Jefferson Lee
// Copyright (c) 2018 Ritwik Abhishek
// Copyright (c) 2018,20 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

class MusicKeyboard {
    static FAKEBLOCKNUMBER = 100000;
    static BUTTONDIVWIDTH = 535; // 5 buttons
    static OUTERWINDOWWIDTH = 758;
    static INNERWINDOWWIDTH = 50;
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;
    // Mapping between keycodes and virtual keyboard
    static BLACKKEYS = [87, 69, 82, 84, 89, 85, 73, 79];
    static WHITEKEYS = [65, 83, 68, 70, 71, 72, 74, 75, 76];
    static SPACE = 32;

    static saveOnKeyDown = document.onkeydown;
    static saveOnKeyUp = document.onkeyup;
    static beginnerMode = localStorage.beginnerMode;
    static unit = MusicKeyboard.beginnerMode === "true" ? 8 : 16;
    static selectedNotes = [];

    constructor() {
        const w = window.innerWidth;
        this._cellScale = w / 1200;


        this._stopOrCloseClicked = false;
        this.playingNow = false;

        this.instruments = [];
        this.noteNames = [];
        this.octaves = [];
        this.keyboardShown = true;
        this.layout = [];
        this.idContainer = [];
        this.tick = false;
        this.meterArgs = [4, 1 / 4];

        // Map between keyboard element ids and the note associated with the key.
        this.noteMapper = {};
        this.blockNumberMapper = {};
        this.instrumentMapper = {};

        this._rowBlocks = [];

        // Each element in the array is [start time, note, id, duration, voice].
        this._notesPlayed = [];
    }


    init() {
        this.tick = false;
        this.playingNow = false;
        let w = window.innerWidth;
        this._cellScale = w / 1200;

        const widgetWindow = window.widgetWindows.windowFor(this, "music keyboard");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        this._keysLayout();
        const tur = logo.turtles.ithTurtle(0);
        this.bpm = tur.singer.bpm.length > 0 ? last(tur.singer.bpm) : Singer.masterBPM;

        widgetWindow.onclose = () => {
            let myNode;
            document.onkeydown = MusicKeyboard.saveOnKeyDown;
            document.onkeyup = MusicKeyboard.saveOnKeyUp;

            if (document.getElementById("keyboardHolder2")) {
                document.getElementById("keyboardHolder2").style.display = "none";
            }

            myNode = document.getElementById("myrow");
            if (myNode != null) {
                myNode.innerHTML = "";
            }

            myNode = document.getElementById("myrow2");
            if (myNode != null) {
                myNode.innerHTML = "";
            }

            MusicKeyboard.selectedNotes = [];
            if (this.loopTick) this.loopTick.stop();
            widgetWindow.destroy();
        };

        this.playButton = widgetWindow.addButton("play-button.svg", MusicKeyboard.ICONSIZE, _("Play"));

        this.playButton.onclick = () => {
            logo.turtleDelay = 0;
            this.processSelected();
            this.playAll();
        };

        widgetWindow.addButton("export-chunk.svg", MusicKeyboard.ICONSIZE, _("Save")).onclick = () => {
            this._save();
        };

        widgetWindow.addButton("erase-button.svg", MusicKeyboard.ICONSIZE, _("Clear")).onclick = () => {
            this._notesPlayed = [];
            MusicKeyboard.selectedNotes = [];
            // if (!that.keyboardShown) {
            this._createTable();
            // }
        };

        widgetWindow.addButton("add2.svg", MusicKeyboard.ICONSIZE, _("Add note")).onclick = () => {
            this._createAddRowPieSubmenu();
        };

        this.midiButton = widgetWindow.addButton("midi.svg", MusicKeyboard.ICONSIZE, _("MIDI"));
        this.midiButton.onclick = () => {
            this.doMIDI();
        };

        this.tickButton = widgetWindow.addButton("metronome.svg", MusicKeyboard.ICONSIZE, _("Metronome"));
        this.tickButton.onclick = () => {
            if (this.tick) {
                this.tick = false;
                this.loopTick.stop();
            } else {
                this.tick = true;
                logo.synth.loadSynth(0, "cow bell");
                this.loopTick = logo.synth.loop(
                    0,
                    "cow bell",
                    "C5",
                    1 / 64,
                    0,
                    this.bpm || 90,
                    0.07
                );
                setTimeout(() => {
                    logo.synth.start();
                }, 500);
            }
        };

        // Append keyboard and div on widget windows
        this.keyboardDiv = document.createElement("div");
        const attr = document.createAttribute("id");
        attr.value = "mkbKeyboardDiv";
        this.keyboardDiv.setAttributeNode(attr);
        this.keyTable = document.createElement("div");
        widgetWindow.getWidgetBody().append(this.keyboardDiv);
        widgetWindow.getWidgetBody().append(this.keyTable);
        widgetWindow.getWidgetBody().style.height = "550px";
        widgetWindow.getWidgetBody().style.width = "1000px";

        this._createKeyboard();

        this._createTable();

        w = Math.max(
            Math.min(window.innerWidth, this._cellScale * MusicKeyboard.OUTERWINDOWWIDTH - 20),
            MusicKeyboard.BUTTONDIVWIDTH
        );

        //Change widget size on fullscreen mode, else
        //revert back to original size on unfullscreen mode
        widgetWindow.onmaximize = () => {
            if (widgetWindow._maximized) {
                widgetWindow.getWidgetBody().style.position = "absolute";
                widgetWindow.getWidgetBody().style.height = "calc(100vh - 64px)";
                widgetWindow.getWidgetBody().style.width = "200vh";
                docById("mkbOuterDiv").style.width = "calc(200vh - 64px)";
                docById("keyboardHolder2").style.width = "calc(200vh - 64px)";
                try {
                    docById("mkbInnerDiv").style.width = "calc(200vh - 64px)";
                } catch (e) {
                    // Does this happen?
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
    }

    addRowBlock(rowBlock) {
        // In case there is a repeat block, use a unique block number
        // for each instance.
        while (this._rowBlocks.indexOf(rowBlock) !== -1) {
            rowBlock = rowBlock + 1000000;
        }

        this._rowBlocks.push(rowBlock);
    }

    processSelected() {
        if (this._notesPlayed.length === 0) {
            MusicKeyboard.selectedNotes = [];
            return;
        }

        // We want to sort the list by startTime.
        this._notesPlayed.sort((a, b) => {
            return a.startTime - b.startTime;
        });

        // selectedNotes is used for playback. Coincident notes are
        // grouped together. It is built from notesPlayed.

        MusicKeyboard.selectedNotes = [
            {
                noteOctave: [this._notesPlayed[0].noteOctave],
                objId: [this._notesPlayed[0].objId],
                duration: [this._notesPlayed[0].duration],
                voice: [this._notesPlayed[0].voice],
                blockNumber: [this._notesPlayed[0].blockNumber],
                startTime: this._notesPlayed[0].startTime
            }
        ];

        let j = 0;
        for (let i = 1; i < this._notesPlayed.length; i++) {
            while (
                i < this._notesPlayed.length &&
                this._notesPlayed[i].startTime === this._notesPlayed[i - 1].startTime
            ) {
                MusicKeyboard.selectedNotes[j].noteOctave.push(this._notesPlayed[i].noteOctave);
                MusicKeyboard.selectedNotes[j].objId.push(this._notesPlayed[i].objId);
                MusicKeyboard.selectedNotes[j].duration.push(this._notesPlayed[i].duration);
                MusicKeyboard.selectedNotes[j].voice.push(this._notesPlayed[i].voice);
                MusicKeyboard.selectedNotes[j].blockNumber.push(this._notesPlayed[i].blockNumber);
                i++;
            }

            j++;
            if (i < this._notesPlayed.length) {
                MusicKeyboard.selectedNotes.push({
                    noteOctave: [this._notesPlayed[i].noteOctave],
                    objId: [this._notesPlayed[i].objId],
                    duration: [this._notesPlayed[i].duration],
                    voice: [this._notesPlayed[i].voice],
                    blockNumber: [this._notesPlayed[i].blockNumber],
                    startTime: this._notesPlayed[i].startTime
                });
            }
        }
    }

    addKeyboardShortcuts() {

        let duration = 0;
        const startTime = {};
        const temp1 = {};
        const temp2 = {};
        const current = new Set();

        const __startNote = (event) => {
            let i, id, ele;
            if (MusicKeyboard.WHITEKEYS.indexOf(event.keyCode) !== -1) {
                i = MusicKeyboard.WHITEKEYS.indexOf(event.keyCode);
                id = "whiteRow" + i.toString();
            } else if (MusicKeyboard.BLACKKEYS.indexOf(event.keyCode) !== -1) {
                i = MusicKeyboard.BLACKKEYS.indexOf(event.keyCode);
                id = "blackRow" + i.toString();
            } else if (MusicKeyboard.SPACE == event.keyCode) {
                id = "rest";
            }

            ele = docById(id);
            if (!(id in startTime)) {
                let startDate = new Date();
                startTime[id] = startDate.getTime();
            }

            if (ele !== null && ele !== undefined) {
                ele.style.backgroundColor = platformColor.orange;
                temp1[id] = ele.getAttribute("alt").split("__")[0];
                if (temp1[id] === "hertz") {
                    temp2[id] = parseInt(ele.getAttribute("alt").split("__")[1]);
                } else if (temp1[id] in FIXEDSOLFEGE1) {
                    temp2[id] =
                        FIXEDSOLFEGE1[temp1[id]].replace(SHARP, "#").replace(FLAT, "b") +
                        ele.getAttribute("alt").split("__")[1];
                } else {
                    temp2[id] =
                        temp1[id].replace(SHARP, "#").replace(FLAT, "b") +
                        ele.getAttribute("alt").split("__")[1];
                }

                if (id == "rest") {
                    this.endTime = undefined;
                    return;
                }

                logo.synth.trigger(0, temp2[id], 1, this.instrumentMapper[id], null, null);

                if (this.tick) {
                    let restDuration = (startTime[id] - this.endTime) / 1000.0;

                    restDuration /= 60; // time in minutes
                    restDuration *= this.bpm;
                    restDuration *= this.meterArgs[1];

                    // eslint-disable-next-line max-len
                    restDuration = parseFloat((Math.round(restDuration * MusicKeyboard.unit) / MusicKeyboard.unit).toFixed(4));

                    if (restDuration === 0) {
                        restDuration = 0;
                    } else {
                        this._notesPlayed.push({
                            startTime: this.endTime,
                            noteOctave: "R",
                            objId: null,
                            duration: parseFloat(restDuration)
                        });
                        //this._createTable();
                    }
                }
                this.endTime = undefined;
            }
        };

        const __keyboarddown = (event) => {
            if (current.has(event.keyCode)) return;

            __startNote(event);
            current.add(event.keyCode);

            //event.preventDefault();
        };

        const __endNote = (event) => {
            let i, id, ele;
            if (MusicKeyboard.WHITEKEYS.indexOf(event.keyCode) !== -1) {
                i = MusicKeyboard.WHITEKEYS.indexOf(event.keyCode);
                id = "whiteRow" + i.toString();
            } else if (MusicKeyboard.BLACKKEYS.indexOf(event.keyCode) !== -1) {
                i = MusicKeyboard.BLACKKEYS.indexOf(event.keyCode);
                id = "blackRow" + i.toString();
            } else if (MusicKeyboard.SPACE == event.keyCode) {
                id = "rest";
            }

            ele = docById(id);
            const newDate = new Date();
            this.endTime = newDate.getTime();
            duration = (this.endTime - startTime[id]) / 1000.0;

            if (ele !== null && ele !== undefined) {
                if (id.includes("blackRow")) {
                    ele.style.backgroundColor = "black";
                } else {
                    ele.style.backgroundColor = "white";
                }

                // no = ele.getAttribute("alt").split("__")[2];

                duration /= 60;
                duration *= this.bpm;
                duration *= this.meterArgs[1];

                // eslint-disable-next-line max-len
                duration = parseFloat((Math.round(duration * MusicKeyboard.unit) / MusicKeyboard.unit).toFixed(4));

                if (duration === 0) {
                    duration = 1 / MusicKeyboard.unit;
                } else if (duration < 0) {
                    duration = -duration;
                }
                if (id == "rest") {
                    this._notesPlayed.push({
                        startTime: startTime[id],
                        noteOctave: "R",
                        objId: null,
                        duration: parseFloat(duration)
                    });
                } else {
                    logo.synth.stopSound(0, this.instrumentMapper[id], temp2[id]);
                    this._notesPlayed.push({
                        startTime: startTime[id],
                        noteOctave: temp2[id],
                        objId: id,
                        duration: duration,
                        voice: this.instrumentMapper[id],
                        blockNumber: this.blockNumberMapper[id]
                    });
                }
                this._createTable();

                delete startTime[id];
                delete temp1[id];
                delete temp2[id];
            }
        };

        const __keyboardup = (event) => {
            current.delete(event.keyCode);
            __endNote(event);
            //event.preventDefault();
        };

        document.onkeydown = __keyboarddown;
        document.onkeyup = __keyboardup;
    }

    loadHandler(element, i, blockNumber) {
        const temp1 = this.layout[i].noteName;
        let temp2;
        if (temp1 === "hertz") {
            temp2 = this.layout[i].noteOctave;
        } else if (temp1 in FIXEDSOLFEGE1) {
            temp2 =
                FIXEDSOLFEGE1[temp1].replace(SHARP, "#").replace(FLAT, "b") +
                this.layout[i].noteOctave;
        } else {
            temp2 = temp1.replace(SHARP, "#").replace(FLAT, "b") + this.layout[i].noteOctave;
        }

        this.blockNumberMapper[element.id] = blockNumber;
        this.instrumentMapper[element.id] = this.layout[i].voice;
        this.noteMapper[element.id] = temp2;

        let duration = 0;
        let startDate = new Date();
        let startTime = 0;

        const __startNote = (element) => {
            startDate = new Date();
            startTime = startDate.getTime(); // Milliseconds();
            element.style.backgroundColor = platformColor.orange;
            logo.synth.trigger(
                0,
                this.noteMapper[element.id],
                1,
                this.instrumentMapper[element.id],
                null,
                null
            );
        };

        element.onmousedown = () => {
            __startNote(element);
        };

        const __endNote = (element) => {
            const id = element.id;
            if (id.includes("blackRow")) {
                element.style.backgroundColor = "black";
            } else {
                element.style.backgroundColor = "white";
            }

            const now = new Date();
            duration = now.getTime() - startTime;
            duration /= 1000;
            logo.synth.stopSound(
                0,
                this.instrumentMapper[element.id],
                this.noteMapper[element.id]
            );
            if (MusicKeyboard.beginnerMode === "true") {
                duration = parseFloat((Math.round(duration * 8) / 8).toFixed(3));
            } else {
                duration = parseFloat((Math.round(duration * 16) / 16).toFixed(4));
            }

            if (duration === 0) {
                duration = 0.125;
            } else if (duration < 0) {
                duration = -duration;
            }

            this._notesPlayed.push({
                startTime: startTime,
                noteOctave: this.noteMapper[element.id],
                objId: element.id,
                duration: duration,
                voice: this.instrumentMapper[element.id],
                blockNumber: this.blockNumberMapper[element.id]
            });
            this._createTable();
        };

        element.onmouseout = () => {
            // __endNote();
        };

        element.onmouseup = () => {
            __endNote(element);
        };
    }



    playAll() {
        if (MusicKeyboard.selectedNotes.length <= 0) {
            return;
        }

        this.playingNow = !this.playingNow;
        const playButtonCell = this.playButton;

        if (this.playingNow) {
            playButtonCell.innerHTML =
                '&nbsp;&nbsp;<img src="header-icons/' +
                "stop-button.svg" +
                '" title="' +
                _("stop") +
                '" alt="' +
                _("stop") +
                '" height="' +
                MusicKeyboard.ICONSIZE +
                '" width="' +
                MusicKeyboard.ICONSIZE +
                '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';

            if (MusicKeyboard.selectedNotes.length < 1) {
                return;
            }

            const notes = [];
            let ele, zx, res, cell;
            for (let i = 0; i < MusicKeyboard.selectedNotes[0].noteOctave.length; i++) {
                if (this.keyboardShown && MusicKeyboard.selectedNotes[0].objId[0] !== null) {
                    ele = docById(MusicKeyboard.selectedNotes[0].objId[i]);
                    if (ele !== null) {
                        ele.style.backgroundColor = "lightgrey";
                    }
                }

                zx = MusicKeyboard.selectedNotes[0].noteOctave[i];
                res = zx;
                if (typeof zx === "string") {
                    res = zx.replace(SHARP, "#").replace(FLAT, "b");
                }

                notes.push(res);
            }

            if (!this.keyboardShown) {
                cell = docById("cells-0");
                cell.style.backgroundColor = platformColor.selectorBackground;
            }

            this._stopOrCloseClicked = false;
            // eslint-disable-next-line max-len
            this._playChord(notes, MusicKeyboard.selectedNotes[0].duration, MusicKeyboard.selectedNotes[0].voice);
            const maxWidth = Math.max.apply(Math, MusicKeyboard.selectedNotes[0].duration);
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
                MusicKeyboard.ICONSIZE +
                '" width="' +
                MusicKeyboard.ICONSIZE +
                '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        }
    }

    playOne(counter, time, playButtonCell) {
        setTimeout(() => {
            let cell, eleid, ele, notes, zx, res, maxWidth;
            if (counter < MusicKeyboard.selectedNotes.length) {
                if (this._stopOrCloseClicked) {
                    return;
                }

                if (!this.keyboardShown) {
                    cell = docById("cells-" + counter);
                    cell.style.backgroundColor = platformColor.selectorBackground;
                }

                // eslint-disable-next-line max-len
                if (this.keyboardShown && MusicKeyboard.selectedNotes[counter - 1].objId[0] !== null) {
                    // eslint-disable-next-line max-len
                    for (let i = 0; i < MusicKeyboard.selectedNotes[counter - 1].noteOctave.length; i++) {
                        eleid = MusicKeyboard.selectedNotes[counter - 1].objId[i];
                        ele = docById(eleid);
                        if (eleid.includes("blackRow")) {
                            ele.style.backgroundColor = "black";
                        } else {
                            ele.style.backgroundColor = "white";
                        }
                    }
                }

                const notes = [];
                for (let i = 0; i < MusicKeyboard.selectedNotes[counter].noteOctave.length; i++) {
                    // eslint-disable-next-line max-len
                    if (this.keyboardShown && MusicKeyboard.selectedNotes[counter].objId[0] !== null) {
                        this.idContainer.findIndex((ele) => {
                            return ele[1] === MusicKeyboard.selectedNotes[counter].objId[i];
                        });

                        ele = docById(MusicKeyboard.selectedNotes[counter].objId[i]);
                        if (ele !== null) {
                            ele.style.backgroundColor = "lightgrey";
                        }
                    }

                    zx = MusicKeyboard.selectedNotes[counter].noteOctave[i];
                    res = zx;
                    if (typeof zx === "string") {
                        res = zx.replace(SHARP, "#").replace(FLAT, "b");
                    }
                    notes.push(res);
                }

                if (this.playingNow) {
                    this._playChord(
                        notes,
                        MusicKeyboard.selectedNotes[counter].duration,
                        MusicKeyboard.selectedNotes[counter].voice
                    );
                }

                maxWidth = Math.max.apply(Math, MusicKeyboard.selectedNotes[counter].duration);
                this.playOne(counter + 1, maxWidth, playButtonCell);
            } else {
                playButtonCell.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/' +
                    "play-button.svg" +
                    '" title="' +
                    _("Play") +
                    '" alt="' +
                    _("Play") +
                    '" height="' +
                    MusicKeyboard.ICONSIZE +
                    '" width="' +
                    MusicKeyboard.ICONSIZE +
                    '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
                this.playingNow = false;
                if (!this.keyboardShown) {
                    this._createTable();
                } else {
                    this._createKeyboard();
                }
            }
        }, time * 1000 + 125);
    }

    _playChord(notes, noteValue, instruments) {
        if (notes[0] === "R") {
            return;
        }

        setTimeout(() => {
            logo.synth.trigger(0, notes[0], noteValue[0], instruments[0], null, null);
        }, 1);

        if (notes.length > 1) {
            setTimeout(() => {
                logo.synth.trigger(0, notes[1], noteValue[0], instruments[1], null, null);
            }, 1);
        }

        if (notes.length > 2) {
            setTimeout(() => {
                logo.synth.trigger(0, notes[2], noteValue[0], instruments[2], null, null);
            }, 1);
        }

        if (notes.length > 3) {
            setTimeout(() => {
                logo.synth.trigger(0, notes[3], noteValue[0], instruments[3], null, null);
            }, 1);
        }
    }

    _keysLayout() {
        this.layout = [];
        const sortableList = [];
        for (let i = 0; i < this.noteNames.length; i++) {
            if (this.noteNames[i] === "drum") {
                sortableList.push({
                    frequency: 1000000, // for sorting purposes
                    noteName: this.noteNames[i],
                    noteOctave: this.octaves[i],
                    blockNumber: this._rowBlocks[i],
                    voice: this.instruments[i]
                });
            } else if (this.noteNames[i] === "hertz") {
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
                        logo.turtles.ithTurtle(0).singer.keySignature
                    ),
                    noteName: this.noteNames[i],
                    noteOctave: this.octaves[i],
                    blockNumber: this._rowBlocks[i],
                    voice: this.instruments[i]
                });
            }
        }

        let sortedList = sortableList.sort((a, b) => {
            return a.frequency - b.frequency;
        });

        const unique = [];
        this.remove = [];

        sortedList = sortedList.filter((item) => {
            if (unique.indexOf(item.noteName + item.noteOctave) === -1) {
                unique.push(item.noteName + item.noteOctave);
                return true;
            }

            this.remove.push(item.blockNumber);
            return false;
        });

        const removeBlock = (i) => {
            setTimeout(() => {
                this._removePitchBlock(this.remove[i]);
            }, 200);
        };

        for (let i = 0; i < this.remove.length; i++) {
            removeBlock(i);
        }

        const newList = this.fillChromaticGaps(sortedList);

        for (let i = 0; i < newList.length; i++) {
            this.layout.push({
                noteName: newList[i].noteName,
                noteOctave: newList[i].noteOctave,
                blockNumber: newList[i].blockNumber,
                voice: newList[i].voice
            });
        }
    }

    _setNotes(colIndex, playNote) {
        const start = docById("cells-" + colIndex).getAttribute("start");

        this._notesPlayed = this._notesPlayed.filter((ele) => {
            return ele.startTime != parseInt(start);
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
                startTime: parseInt(start),
                noteOctave: "R",
                objId: null,
                duration: parseFloat(dur)
            });
            this._notesPlayed.sort((a, b) => {
                return a.startTime - b.startTime;
            });
        }
    }

    _setNoteCell(j, colIndex, start, playNote) {
        const n = this.layout.length;
        const temp1 = this.layout[n - j - 1].noteName;
        let temp2;
        if (temp1 === "hertz") {
            temp2 = this.layout[n - j - 1].noteOctave;
        } else if (temp1 in FIXEDSOLFEGE1) {
            temp2 =
                FIXEDSOLFEGE1[temp1].replace(SHARP, "#").replace(FLAT, "b") +
                this.layout[n - j - 1].noteOctave;
        } else {
            temp2 =
                temp1.replace(SHARP, "#").replace(FLAT, "b") + this.layout[n - j - 1].noteOctave;
        }

        const ele = docById(j + ":" + colIndex);
        this._notesPlayed.push({
            startTime: parseInt(start),
            noteOctave: temp2,
            blockNumber: this.layout[n - j - 1].blockNumber,
            duration: parseFloat(ele.getAttribute("alt")),
            objId: this.layout[n - j - 1].objId,
            voice: this.layout[n - j - 1].voice
        });

        this._notesPlayed.sort((a, b) => {
            return a.startTime - b.startTime;
        });

        if (playNote) {
            logo.synth.trigger(
                0,
                temp2,
                ele.getAttribute("alt"),
                this.instruments[0],
                null,
                null
            );
        }
    }

    makeClickable() {
        const rowNote = docById("mkbNoteDurationRow");
        let cell;

        for (let i = 0; i < MusicKeyboard.selectedNotes.length; i++) {
            cell = rowNote.cells[i];

            cell.onclick = (event) => {
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

                cell.onmousedown = (e) => {
                    cell = e.target;
                    isMouseDown = true;
                    const obj = cell.id.split(":");
                    // const i = Number(obj[0]);
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
                    const obj = cell.id.split(":");
                    // const i = Number(obj[0]);
                    const j = Number(obj[1]);
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

                cell.onmouseup = () => {
                    isMouseDown = false;
                };
            }
        }
    }

    _noteWidth(noteValue) {
        return Math.max(Math.floor(EIGHTHNOTEWIDTH * (8 * noteValue) * this._cellScale), 15);
    }

    _createTable() {
        this.processSelected();
        const mkbTableDiv = this.keyTable;
        mkbTableDiv.style.display = "inline";
        mkbTableDiv.style.visibility = "visible";
        mkbTableDiv.style.border = "0px";
        mkbTableDiv.style.width = "700px";

        mkbTableDiv.innerHTML = "";

        mkbTableDiv.innerHTML =
            '<div id="mkbOuterDiv"><div id="mkbInnerDiv"><table cellpadding="0px" id="mkbTable"></table></div></div>';

        let n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 8);

        const innerDiv = docById("mkbInnerDiv");
        const outerDiv = docById("mkbOuterDiv");
        if (this.layout.length > n) {
            outerDiv.style.height = this._cellScale * MATRIXSOLFEHEIGHT * (n + 5) + "px";
        } else {
            outerDiv.style.height =
                this._cellScale * MATRIXSOLFEHEIGHT * (this.layout.length + 4) + "px";
        }

        outerDiv.style.backgroundColor = "white";
        outerDiv.style.marginTop = "15px";

        innerDiv.style.marginLeft = 0;

        const mkbTable = docById("mkbTable");
        if (MusicKeyboard.selectedNotes.length < 1) {
            outerDiv.innerHTML = "";
            return;
        }

        let j = 0;
        n = this.layout.length;
        let mkbTableRow, cell, mkbCell, mkbCellTable;
        for (let i = this.layout.length - 1; i >= 0; i--) {
            mkbTableRow = mkbTable.insertRow();
            cell = mkbTableRow.insertCell();
            cell.style.backgroundColor = platformColor.graphicsLabelBackground;
            cell.style.fontSize = this._cellScale * 100 + "%";
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + "px";
            cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + "px";
            cell.style.maxWidth = cell.style.minWidth;
            cell.className = "headcol"; // This cell is fixed horizontally.
            if (this.layout[i].noteName === "drum") {
                cell.innerHTML = this.layout[i].voice;
            } else if (this.layout[i].noteName === "hertz") {
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

            cell.onclick = (event) => {
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
            mkbCell.innerHTML = '<table cellpadding="0px" id="mkbCellTable' + j + '"></table>';
            mkbCellTable = docById("mkbCellTable" + j);
            mkbCellTable.style.marginTop = "-1px";

            // We'll use this element to put the clickable notes for this row.
            const mkbRow = mkbCellTable.insertRow();
            mkbRow.setAttribute("id", "mkb" + j);
            j += 1;
        }

        mkbTableRow = mkbTable.insertRow();
        cell = mkbTableRow.insertCell();
        cell.style.backgroundColor = platformColor.graphicsLabelBackground;
        cell.style.fontSize = this._cellScale * 100 + "%";
        cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
        cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + "px";
        cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + "px";
        cell.style.maxWidth = cell.style.minWidth;
        cell.className = "headcol"; // This cell is fixed horizontally.
        cell.innerHTML = _("duration");

        const newCell = mkbTableRow.insertCell();
        newCell.innerHTML = '<table  class="mkbTable" cellpadding="0px"><tr id="mkbNoteDurationRow"></tr></table>';
        const cellColor = "lightgrey";
        let maxWidth, noteMaxWidth, row, ind, dur;
        for (let j = 0; j < MusicKeyboard.selectedNotes.length; j++) {
            maxWidth = Math.max.apply(Math, MusicKeyboard.selectedNotes[j].duration);
            noteMaxWidth =
                this._noteWidth(Math.max.apply(Math, MusicKeyboard.selectedNotes[j].duration)) * 2 + "px";
            n = this.layout.length;
            for (let i = 0; i < this.layout.length; i++) {
                row = docById("mkb" + i);
                cell = row.insertCell();
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
                cell.style.width = noteMaxWidth;
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;

                if (
                    // eslint-disable-next-line max-len
                    MusicKeyboard.selectedNotes[j].blockNumber.indexOf(this.layout[n - i - 1].blockNumber) !== -1
                ) {
                    // eslint-disable-next-line max-len
                    ind = MusicKeyboard.selectedNotes[j].blockNumber.indexOf(this.layout[n - i - 1].blockNumber);
                    cell.setAttribute("alt", MusicKeyboard.selectedNotes[j].duration[ind]);
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

            dur = toFraction(Math.max.apply(Math, MusicKeyboard.selectedNotes[j].duration));
            row = docById("mkbNoteDurationRow");
            cell = row.insertCell();
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
            cell.style.width = noteMaxWidth;
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.lineHeight = 60 + "%";
            cell.style.textAlign = "center";
            cell.innerHTML = dur[0].toString() + "/" + dur[1].toString();
            cell.setAttribute("id", "cells-" + j);
            cell.setAttribute("start", MusicKeyboard.selectedNotes[j].startTime);
            cell.setAttribute("dur", maxWidth);
            cell.style.backgroundColor = platformColor.rhythmcellcolor;
        }

        
        innerDiv.scrollLeft = innerDiv.scrollWidth; // Force to the right.
        this.makeClickable();
    }

    _createpiesubmenu(cellId, start) {
        docById("wheelDivptm").style.display = "";

        this._menuWheel = new wheelnav("wheelDivptm", null, 600, 600);
        this._exitWheel = new wheelnav("_exitWheel", this._menuWheel.raphael);

        this._tabsWheel = new wheelnav("_tabsWheel", this._menuWheel.raphael);
        this._durationWheel = new wheelnav("_durationWheel", this._menuWheel.raphael);
        this.newNoteValue = 2;
        const mainTabsLabels = ["divide", "delete", "add", String(this.newNoteValue)];
        const editDurationLabels = ["1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8", "1/1"];

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

        const tabsLabels = [
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

        for (let i = 0; i < tabsLabels.length; i++) {
            this._tabsWheel.navItems[i].navItem.hide();
        }

        this._menuWheel.createWheel(mainTabsLabels);
        this._exitWheel.createWheel(["x", ""]);

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "250px";
        docById("wheelDivptm").style.width = "250px";

        const x = docById(cellId).getBoundingClientRect().x;
        const y = docById(cellId).getBoundingClientRect().y;

        docById("wheelDivptm").style.left =
            Math.min(
                logo.blocks.turtles._canvas.width - 200,
                Math.max(0, x * logo.blocks.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                logo.blocks.turtles._canvas.height - 250,
                Math.max(0, y * logo.blocks.getStageScale())
            ) + "px";

        this._exitWheel.navItems[0].navigateFunction = () => {
            docById("wheelDivptm").style.display = "none";
            this._menuWheel.removeWheel();
            this._exitWheel.removeWheel();
        };

        let flag = 0;
        this._menuWheel.navItems[0].navigateFunction = () => {
            this._divideNotes(start, this.newNoteValue);
        };

        this._menuWheel.navItems[1].navigateFunction = () => {
            this._deleteNotes(start);
        };

        this._menuWheel.navItems[2].navigateFunction = () => {
            this._addNotes(cellId, start, this.newNoteValue);
        };

        this._menuWheel.navItems[3].navigateFunction = () => {
            if (!flag) {
                for (let i = 12; i < 19; i++) {
                    docById(
                        "wheelnav-wheelDivptm-title-3"
                    ).children[0].textContent = this.newNoteValue;
                    this._tabsWheel.navItems[i].navItem.show();
                }

                flag = 1;
            } else {
                for (let i = 12; i < 19; i++) {
                    docById(
                        "wheelnav-wheelDivptm-title-3"
                    ).children[0].textContent = this.newNoteValue;
                    this._tabsWheel.navItems[i].navItem.hide();
                }

                flag = 0;
            }
        };

        const __selectValue = () => {
            const i = this._durationWheel.selectedNavItemIndex;
            const value = editDurationLabels[i];
            const duration = value.split("/");
            this._updateDuration(start, duration);
        };

        for (let i = 0; i < editDurationLabels.length; i++) {
            this._durationWheel.navItems[i].navigateFunction = __selectValue;
        }

        for (let i = 12; i < 19; i++) {
            this._tabsWheel.navItems[i].navigateFunction = () => {
                const j = this._tabsWheel.selectedNavItemIndex;
                this.newNoteValue = tabsLabels[j];
                docById("wheelnav-wheelDivptm-title-3").children[0].textContent = tabsLabels[j];
            };
        }
    }

    _updateDuration(start, duration) {
        start = parseInt(start);
        duration = parseInt(duration[0]) / parseInt(duration[1]);
        const newduration = parseFloat((Math.round(duration * 8) / 8).toFixed(3));
        this._notesPlayed = this._notesPlayed.map((item) => {
            if (item.startTime === start) {
                item.duration = newduration;
            }

            return item;
        });
        this._createTable();
    }

    _addNotes(cellId, start, divideNoteBy) {
        start = parseInt(start);
        const cell = docById(cellId);
        const dur = cell.getAttribute("dur");

        this._notesPlayed = this._notesPlayed.reduce((prevValue, curValue) => {
            let oldcurValue, newcurValue;
            if (parseInt(curValue.startTime) === start) {
                prevValue = prevValue.concat([curValue]);
                oldcurValue = JSON.parse(JSON.stringify(curValue));
                for (let i = 0; i < divideNoteBy; i++) {
                    newcurValue = JSON.parse(JSON.stringify(oldcurValue));
                    newcurValue.startTime = oldcurValue.startTime + oldcurValue.duration * 1000;
                    prevValue = prevValue.concat([newcurValue]);
                    oldcurValue = newcurValue;
                }

                return prevValue;
            } else if (parseInt(curValue.startTime) > start) {
                curValue.startTime = curValue.startTime + dur * 1000 * divideNoteBy;
                return prevValue.concat([curValue]);
            }

            return prevValue.concat([curValue]);
        }, []);

        this._createTable();
    }

    _deleteNotes(start) {
        start = parseInt(start);

        this._notesPlayed = this._notesPlayed.filter((ele) => {
            return parseInt(ele.startTime) !== start;
        });

        this._createTable();
    }

    _divideNotes(start, divideNoteBy) {
        start = parseInt(start);

        this._notesPlayed = this._notesPlayed.reduce((prevValue, curValue) => {
            let newcurValue, newcurValue2;
            if (parseInt(curValue.startTime) === start) {
                if (MusicKeyboard.beginnerMode === "true") {
                    if (curValue.duration / divideNoteBy < 0.125) {
                        return prevValue.concat([curValue]);
                    }
                } else {
                    if (curValue.duration / divideNoteBy < 0.0625) {
                        return prevValue.concat([curValue]);
                    }
                }

                newcurValue = JSON.parse(JSON.stringify(curValue));
                newcurValue.duration = curValue.duration / divideNoteBy;
                prevValue = prevValue.concat([newcurValue]);
                let oldcurValue = newcurValue;
                for (let i = 0; i < divideNoteBy - 1; i++) {
                    newcurValue2 = JSON.parse(JSON.stringify(oldcurValue));
                    newcurValue2.startTime = parseInt(
                        newcurValue2.startTime + newcurValue2.duration * 1000
                    );
                    prevValue = prevValue.concat([newcurValue2]);
                    oldcurValue = newcurValue2;
                }

                return prevValue;
            }

            return prevValue.concat([curValue]);
        }, []);

        this._createTable();
    }

    _createAddRowPieSubmenu() {
        docById("wheelDivptm").style.display = "";
        docById("wheelDivptm").style.zIndex = "300";
        const pitchLabels = ["do", "re", "mi", "fa", "sol", "la", "ti"];
        const hertzLabels = [261, 294, 327, 348, 392, 436, 490, 523];
        const VALUESLABEL = ["pitch", "hertz"];
        const VALUES = ["imgsrc: images/chime.svg", "imgsrc: images/synth.svg"];
        const valueLabel = [];
        let label;
        let creatingNewNote = false;
        for (let i = 0; i < VALUES.length; i++) {
            label = _(VALUES[i]);
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

        this._menuWheel.animatetime = 0;
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

        const x = 100;
        const y = 100;

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "300px";
        docById("wheelDivptm").style.width = "300px";
        docById("wheelDivptm").style.left =
            Math.min(
                logo.blocks.turtles._canvas.width - 200,
                Math.max(0, x * logo.blocks.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                logo.blocks.turtles._canvas.height - 250,
                Math.max(0, y * logo.blocks.getStageScale())
            ) + "px";

        this._exitWheel.navItems[0].navigateFunction = () => {
            docById("wheelDivptm").style.display = "none";
            this._menuWheel.removeWheel();
            this._exitWheel.removeWheel();
        };

        let rLabel;
        let rArg;

        const __selectionChanged = () => {
            if (creatingNewNote) {
                // Debounce
                return;
            }
            const label = VALUESLABEL[this._menuWheel.selectedNavItemIndex];
            const newBlock = logo.blocks.blockList.length;

            if (label === "pitch") {
                for (let i = 0; i < pitchLabels.length; i++) {
                    if (
                        pitchLabels[i].indexOf(last(this.layout).noteName) !== -1 ||
                        last(this.layout).noteName.indexOf(pitchLabels[i]) !== -1
                    ) {
                        break;
                    }
                }

                rLabel = pitchLabels[(i + 1) % pitchLabels.length];
                for (let j = this.layout.length; j > 0; j--) {
                    rArg = this.layout[j - 1].noteOctave;
                    if (isNaN(rArg)) {
                        continue;
                    }
                    if (rArg > 0 && rArg < 9) {
                        break;
                    }
                }
                if ((i + 1) % pitchLabels.length === 0) {
                    rArg += 1;
                }
            } else {
                rLabel = "hertz";
                rArg = 392;
                let flag = false;
                for (let i = 0; i < hertzLabels.length; i++) {
                    flag = false;
                    for (let j = 0; j < this.layout.length; j++) {
                        if (this.layout[j].noteName === "hertz") {
                            if (this.layout[j].noteOctave === hertzLabels[i]) {
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
                    logo.blocks.loadNewBlocks([
                        [0, ["pitch", {}], 0, 0, [null, 1, 2, null]],
                        [1, ["solfege", { value: rLabel }], 0, 0, [0]],
                        [2, ["number", { value: rArg }], 0, 0, [0]]
                    ]);
                    break;
                case "hertz":
                    logo.blocks.loadNewBlocks([
                        [0, ["hertz", {}], 0, 0, [null, 1, null]],
                        [1, ["number", { value: rArg }], 0, 0, [0]]
                    ]);
                    break;
                default:
                    console.log("Nothing to do for " + label);
            }

            let aboveBlock = -1;
            for (let i = this.layout.length; i > 0; i--) {
                if (this.layout[i - 1].blockNumber < MusicKeyboard.FAKEBLOCKNUMBER) {
                    aboveBlock = this.layout[i - 1].blockNumber;
                    break;
                }
            }
            if (aboveBlock !== -1) {
                creatingNewNote = true;
                setTimeout(() => {
                    this._addNotesBlockBetween(aboveBlock, newBlock);
                    creatingNewNote = false;
                    this.layout.push({
                        noteName: rLabel,
                        noteOctave: rArg,
                        blockNumber: newBlock,
                        voice: this.layout[0].voice
                    });
                    this._sortLayout();
                    this._createTable();
                }, 500);
            } else {
                console.log("Could not find anywhere to insert new block.");
            }
        };

        for (let i = 0; i < valueLabel.length; i++) {
            this._menuWheel.navItems[i].navigateFunction = __selectionChanged;
        }
    }

    _addNotesBlockBetween(aboveBlock, block) {
        const belowBlock = last(logo.blocks.blockList[aboveBlock].connections);
        logo.blocks.blockList[aboveBlock].connections[
            logo.blocks.blockList[aboveBlock].connections.length - 1
        ] = block;

        if (belowBlock !== null) {
            logo.blocks.blockList[belowBlock].connections[0] = block;
        }

        logo.blocks.blockList[block].connections[0] = aboveBlock;

        logo.blocks.blockList[block].connections[
            logo.blocks.blockList[block].connections.length - 1
        ] = belowBlock;

        logo.blocks.adjustDocks(this.blockNo, true);
        logo.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        logo.blocks.refreshCanvas();
    }

    _sortLayout() {
        this.layout.sort((a, b) => {
            let aValue, bValue;
            if (a.noteName == "hertz") {
                aValue = a.noteOctave;
            } else {
                aValue = noteToFrequency(
                    a.noteName + a.noteOctave,
                    logo.turtles.ithTurtle(0).singer.keySignature
                );
            }
            if (b.noteName == "hertz") {
                bValue = b.noteOctave;
            } else {
                bValue = noteToFrequency(
                    b.noteName + b.noteOctave,
                    logo.turtles.ithTurtle(0).singer.keySignature
                );
            }

            return aValue - bValue;
        });

        const unique = [];
        this.remove = [];
        this.layout = this.layout.filter((item, pos) => {
            if (unique.indexOf(item.noteName + item.noteOctave) === -1) {
                unique.push(item.noteName + item.noteOctave);
                return true;
            }

            this.remove = [this.layout[pos - 1].blockNumber, this.layout[pos].blockNumber];
            return false;
        });

        this._notesPlayed.map((item) => {
            if (item.objId === this.remove[1]) {
                item.objId = this.remove[0];
            }

            return item;
        });

        if (this.remove.length) {
            this._removePitchBlock(this.remove[1]);
        }

        if (this.keyboardShown) {
            this._createKeyboard();
        } else {
            this._createTable();
        }
    }

    _removePitchBlock(blockNo) {
        const c0 = logo.blocks.blockList[blockNo].connections[0];
        const c1 = last(logo.blocks.blockList[blockNo].connections);
        if (logo.blocks.blockList[c0].name === "musickeyboard") {
            logo.blocks.blockList[c0].connections[1] = c1;
        } else {
            logo.blocks.blockList[c0].connections[
                logo.blocks.blockList[c0].connections.length - 1
            ] = c1;
        }

        if (c1) {
            logo.blocks.blockList[c1].connections[0] = c0;
        }

        logo.blocks.blockList[blockNo].connections[
            logo.blocks.blockList[blockNo].connections.length - 1
        ] = null;
        logo.blocks.sendStackToTrash(logo.blocks.blockList[blockNo]);
        logo.blocks.adjustDocks(this.blockNo, true);
        logo.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        logo.blocks.refreshCanvas();
    }

    _createColumnPieSubmenu(index, condition) {
        index = parseInt(index);
        if (
            blocks.blockList[this.layout[this.layout.length - index - 1].blockNumber] === undefined
        ) {
            return;
        }

        docById("wheelDivptm").style.display = "";
        docById("wheelDivptm").style.zIndex = "300";

        const noteLabelsI18n = [];
        const accidentals = ["𝄪", "♯", "♮", "♭", "𝄫"];
        let noteLabels = ["ti", "la", "sol", "fa", "mi", "re", "do"];
        
        for (let i = 0; i < noteLabels.length; i++) {
            noteLabelsI18n.push(i18nSolfege(noteLabels[i]));
        }

        if (condition === "synthsblocks") {
            noteLabels = ["261", "294", "327", "348", "392", "436", "490", "523"];
        }

        this._pitchWheel = new wheelnav("wheelDivptm", null, 600, 600);

        this._exitWheel = new wheelnav("_exitWheel", this._pitchWheel.raphael);
        if (condition === "pitchblocks") {
            this._accidentalsWheel = new wheelnav("_accidentalsWheel", this._pitchWheel.raphael);
            this._octavesWheel = new wheelnav("_octavesWheel", this._pitchWheel.raphael);
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

        const octaveLabels = [
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

        if (condition === "pitchblocks") {
            this._accidentalsWheel.colors = platformColor.accidentalsWheelcolors;
            this._accidentalsWheel.slicePathFunction = slicePath().DonutSlice;
            this._accidentalsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._accidentalsWheel.slicePathCustom.minRadiusPercent = 0.5;
            this._accidentalsWheel.slicePathCustom.maxRadiusPercent = 0.75;
            this._accidentalsWheel.sliceSelectedPathCustom = this._accidentalsWheel.slicePathCustom;
            this._accidentalsWheel.sliceInitPathCustom = this._accidentalsWheel.slicePathCustom;

            const accidentalLabels = [];
            for (let i = 0; i < accidentals.length; i++) {
                accidentalLabels.push(accidentals[i]);
            }

            for (let i = 0; i < 9; i++) {
                accidentalLabels.push(null);
                this._accidentalsWheel.colors.push(platformColor.accidentalsWheelcolorspush);
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
            this._octavesWheel.animatetime = 0; // 300;
            this._octavesWheel.createWheel(octaveLabels);
        }

        const x = docById("labelcol" + index).getBoundingClientRect().x;
        const y = docById("labelcol" + index).getBoundingClientRect().y;

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "300px";
        docById("wheelDivptm").style.width = "300px";
        docById("wheelDivptm").style.left =
            Math.min(
                logo.blocks.turtles._canvas.width - 200,
                Math.max(0, x * logo.blocks.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                logo.blocks.turtles._canvas.height - 250,
                Math.max(0, y * logo.blocks.getStageScale())
            ) + "px";

        index = this.layout.length - index - 1;
        const block = this.layout[index].blockNumber;

        let noteValue = logo.blocks.blockList[
            logo.blocks.blockList[block].connections[1]
        ].value;

        if (condition === "pitchblocks") {
            const octaveValue = logo.blocks.blockList[
                logo.blocks.blockList[block].connections[2]
            ].value;
            let accidentalsValue = 2;

            for (let i = 0; i < accidentals.length; i++) {
                if (noteValue.indexOf(accidentals[i]) !== -1) {
                    accidentalsValue = i;
                    noteValue = noteValue.substr(0, noteValue.indexOf(accidentals[i]));
                    break;
                }
            }

            this._accidentalsWheel.navigateWheel(accidentalsValue);
            this._octavesWheel.navigateWheel(octaveLabels.indexOf(octaveValue.toString()));

            this._pitchWheel.navigateWheel(noteLabels.indexOf(noteValue));
        }

        this._exitWheel.navItems[0].navigateFunction = () => {
            docById("wheelDivptm").style.display = "none";
            this._pitchWheel.removeWheel();
            this._exitWheel.removeWheel();
            if (condition === "pitchblocks") {
                this._accidentalsWheel.removeWheel();
                this._octavesWheel.removeWheel();
            }

            this._sortLayout();
        };

        const __hertzSelectionChanged = () => {
            // eslint-disable-next-line max-len
            const blockValue = this._pitchWheel.navItems[this._pitchWheel.selectedNavItemIndex].title;
            const argBlock = logo.blocks.blockList[block].connections[1];
            logo.blocks.blockList[argBlock].text.text = blockValue;
            logo.blocks.blockList[argBlock].value = parseInt(blockValue);

            const z = logo.blocks.blockList[argBlock].container.children.length - 1;
            logo.blocks.blockList[argBlock].container.setChildIndex(
                logo.blocks.blockList[argBlock].text,
                z
            );
            logo.blocks.blockList[argBlock].updateCache();

            const cell = docById("labelcol" + (this.layout.length - index - 1));
            this.layout[index].noteOctave = parseInt(blockValue);
            cell.innerHTML = this.layout[index].noteName + this.layout[index].noteOctave.toString();
            this._notesPlayed.map((item) => {
                if (item.objId == this.layout[index].blockNumber) {
                    item.noteOctave = parseInt(blockValue);
                }
                return item;
            });
        };

        if (condition === "synthsblocks") {
            for (let i = 0; i < noteLabels.length; i++) {
                this._pitchWheel.navItems[i].navigateFunction = __hertzSelectionChanged;
            }
        }

        const __selectionChanged = () => {
            let label = this._pitchWheel.navItems[this._pitchWheel.selectedNavItemIndex].title;
            let labelValue, i, flag;
            if (condition === "pitchblocks") {
                i = noteLabelsI18n.indexOf(label);
                labelValue = noteLabels[i];
                // eslint-disable-next-line max-len
                const attr = this._accidentalsWheel.navItems[this._accidentalsWheel.selectedNavItemIndex]
                    .title;
                flag = false;
                if (attr !== "♮") {
                    label += attr;
                    flag = true;
                }
            } else {
                i = noteLabels.indexOf(label);
                labelValue = label;
            }

            const noteLabelBlock = logo.blocks.blockList[block].connections[1];
            logo.blocks.blockList[noteLabelBlock].text.text = label;
            logo.blocks.blockList[noteLabelBlock].value = labelValue;

            const z = logo.blocks.blockList[noteLabelBlock].container.children.length - 1;
            logo.blocks.blockList[noteLabelBlock].container.setChildIndex(
                logo.blocks.blockList[noteLabelBlock].text,
                z
            );
            logo.blocks.blockList[noteLabelBlock].updateCache();

            if (condition === "pitchblocks") {
                const octave = Number(
                    this._octavesWheel.navItems[this._octavesWheel.selectedNavItemIndex].title);
                logo.blocks.blockList[noteLabelBlock].blocks.setPitchOctave(
                    logo.blocks.blockList[noteLabelBlock].connections[0],
                    octave
                );
            }

            const cell = docById("labelcol" + (this.layout.length - index - 1));
            this.layout[index].noteName = label;
            const octave = Number(
                this._octavesWheel.navItems[this._octavesWheel.selectedNavItemIndex].title);
            this.layout[index].noteOctave = octave;
            cell.innerHTML = this.layout[index].noteName + this.layout[index].noteOctave.toString();
            const temp1 = label;
            let temp2;
            if (temp1 in FIXEDSOLFEGE1) {
                temp2 = FIXEDSOLFEGE1[temp1].replace(SHARP, "#").replace(FLAT, "b") + octave;
            } else {
                temp2 = temp1.replace(SHARP, "#").replace(FLAT, "b") + octave;
            }

            this._notesPlayed.map((item) => {
                if (item.objId == this.layout[index].blockNumber) {
                    item.noteOctave = temp2;
                }
                return item;
            });
        };

        const __pitchPreview = () => {
            const label = this._pitchWheel.navItems[this._pitchWheel.selectedNavItemIndex].title;
            const i = noteLabelsI18n.indexOf(label);
            let labelValue = noteLabels[i];

            // eslint-disable-next-line max-len
            const attr = this._accidentalsWheel.navItems[this._accidentalsWheel.selectedNavItemIndex].title;
            if (attr !== "♮") {
                labelValue += attr;
            }

            const octave = Number(
                this._octavesWheel.navItems[this._octavesWheel.selectedNavItemIndex].title);
            let obj = getNote(
                labelValue,
                octave,
                0,
                logo.turtles.ithTurtle(0).singer.keySignature,
                false,
                null,
                logo.errorMsg,
                logo.synth.inTemperament
            );
            logo.synth.setMasterVolume(PREVIEWVOLUME);
            Singer.setSynthVolume(logo, 0, DEFAULTVOICE, PREVIEWVOLUME);
            logo.synth.trigger(0, [obj[0] + obj[1]], 1 / 8, DEFAULTVOICE, null, null);

            __selectionChanged();
        };

        if (condition === "pitchblocks") {
            for (let i = 0; i < noteLabels.length; i++) {
                this._pitchWheel.navItems[i].navigateFunction = __pitchPreview;
            }

            for (let i = 0; i < accidentals.length; i++) {
                this._accidentalsWheel.navItems[i].navigateFunction = __pitchPreview;
            }

            for (let i = 0; i < 8; i++) {
                this._octavesWheel.navItems[i].navigateFunction = __pitchPreview;
            }
        }
    }

    _createKeyboard() {
        document.onkeydown = null;
        const mkbKeyboardDiv = this.keyboardDiv;
        mkbKeyboardDiv.style.display = "flex";
        mkbKeyboardDiv.style.visibility = "visible";
        mkbKeyboardDiv.style.border = "0px";
        mkbKeyboardDiv.style.width = "100%";
        mkbKeyboardDiv.style.top = "0px";
        mkbKeyboardDiv.style.overflow = "auto";
        mkbKeyboardDiv.innerHTML = "";
        mkbKeyboardDiv.innerHTML =
            ' <div id="keyboardHolder2"><table class="white"><tbody><tr id="myrow"></tr></tbody></table><table class="black"><tbody><tr id="myrow2"></tr></tbody></table></div>';

        const keyboardHolder2 = docById("keyboardHolder2");
        keyboardHolder2.style.bottom = "10px";
        keyboardHolder2.style.left = "0px";
        keyboardHolder2.style.height = "145px";
        keyboardHolder2.style.backgroundColor = "white";
        const blackRow = document.getElementsByClassName("black");
        blackRow[0].style.top = "1px";
        blackRow[0].style.borderSpacing = "0px 0px 20px";
        blackRow[0].style.borderCollapse = "separate";

        let myNode = document.getElementById("myrow");
        myNode.innerHTML = "";
        myNode = document.getElementById("myrow2");
        myNode.innerHTML = "";

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
        // document.getElementById("keyboardHolder2").style.display = "block";
        this.idContainer = [];
        let myrowId = 0;
        let myrow2Id = 0;

        let parenttbl, parenttbl2, el, newel, newel2, nname, elementid, elementid2;
        for (let p = 0; p < this.layout.length; p++) {
            // If the blockNumber is null, don't add a label.
            if (this.layout[p].noteName > MusicKeyboard.FAKEBLOCKNUMBER) {
                parenttbl2 = document.getElementById("myrow2");
                newel2 = document.createElement("td");
                newel2.setAttribute("id", "blackRow" + myrow2Id.toString());
                if ([2, 6, 9, 13, 16, 20].indexOf(myrow2Id) !== -1) {
                    parenttbl2.appendChild(newel2);
                    el = docById("blackRow" + myrow2Id.toString());
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
                this.idContainer.push([
                    "blackRow" + myrow2Id.toString(),
                    this.layout[p].blockNumber
                ]);

                this.layout[p].objId = "blackRow" + myrow2Id.toString();

                myrow2Id++;
                newel2.innerHTML = "";
                newel2.style.visibility = "hidden";
                parenttbl2.appendChild(newel2);
            } else if (this.layout[p].noteName === "drum") {
                parenttbl = document.getElementById("myrow");
                newel = document.createElement("td");
                newel.style.textAlign = "center";
                newel.setAttribute("id", "whiteRow" + myrowId.toString());
                newel.setAttribute(
                    "alt",
                    this.layout[p].noteName +
                    "__" +
                    this.layout[p].voice +
                    "__" +
                    this.layout[p].blockNumber
                );
                this.idContainer.push([
                    "whiteRow" + myrowId.toString(),
                    this.layout[p].blockNumber
                ]);
                newel.innerHTML =
                    "<small>(" +
                    String.fromCharCode(MusicKeyboard.WHITEKEYS[myrowId]) +
                    ")</small><br/>" +
                    this.layout[p].voice;

                this.layout[p].objId = "whiteRow" + myrowId.toString();

                myrowId++;
                newel.style.position = "relative";
                newel.style.zIndex = "100";
                parenttbl.appendChild(newel);
            } else if (this.layout[p].noteName === "hertz") {
                parenttbl = document.getElementById("myrow");
                newel = document.createElement("td");
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
                this.idContainer.push([
                    "whiteRow" + myrowId.toString(),
                    this.layout[p].blockNumber
                ]);
                newel.innerHTML =
                    "<small>(" +
                    String.fromCharCode(MusicKeyboard.WHITEKEYS[myrowId]) +
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
                parenttbl2 = document.getElementById("myrow2");
                newel2 = document.createElement("td");
                newel2.setAttribute("id", "blackRow" + myrow2Id.toString());
                newel2.style.textAlign = "center";
                if ([2, 6, 9, 13, 16, 20].indexOf(myrow2Id) !== -1) {
                    parenttbl2.appendChild(newel2);
                    el = docById("blackRow" + myrow2Id.toString());
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
                this.idContainer.push([
                    "blackRow" + myrow2Id.toString(),
                    this.layout[p].blockNumber
                ]);

                nname = this.layout[p].noteName.replace(SHARP, "").replace("#", "");
                // if (this.layout[p].blockNumber > MusicKeyboard.FAKEBLOCKNUMBER) {
                // } -- Empty Block
                if (SOLFEGENAMES.indexOf(nname) !== -1) {
                    newel2.innerHTML =
                        "<small>(" +
                        String.fromCharCode(MusicKeyboard.BLACKKEYS[myrow2Id]) +
                        ")</small><br/>" +
                        i18nSolfege(nname) +
                        SHARP +
                        this.layout[p].noteOctave;
                } else {
                    newel2.innerHTML =
                        "<small>(" +
                        String.fromCharCode(MusicKeyboard.BLACKKEYS[myrow2Id]) +
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
                parenttbl2 = document.getElementById("myrow2");
                newel2 = document.createElement("td");
                // elementid2 = document.getElementsByTagName("td").length;
                newel2.setAttribute("id", "blackRow" + myrow2Id.toString());
                newel2.style.textAlign = "center";
                if ([2, 6, 9, 13, 16, 20].indexOf(myrow2Id) !== -1) {
                    parenttbl2.appendChild(newel2);
                    el = docById("blackRow" + myrow2Id.toString());
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
                this.idContainer.push([
                    "blackRow" + myrow2Id.toString(),
                    this.layout[p].blockNumber
                ]);
                nname = this.layout[p].noteName.replace(FLAT, "").replace("b", "");
                // if (this.layout[p].blockNumber > MusicKeyboard.FAKEBLOCKNUMBER) {
                // } -- empty block
                if (SOLFEGENAMES.indexOf(nname) !== -1) {
                    newel2.innerHTML =
                        "<small>(" +
                        String.fromCharCode(MusicKeyboard.BLACKKEYS[myrow2Id]) +
                        ")</small><br/>" +
                        i18nSolfege(nname) +
                        FLAT +
                        this.layout[p].noteOctave;
                } else {
                    newel2.innerHTML =
                        "<small>(" +
                        String.fromCharCode(MusicKeyboard.BLACKKEYS[myrow2Id]) +
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
                parenttbl = document.getElementById("myrow");
                newel = document.createElement("td");
                // elementid = document.getElementsByTagName("td").length;

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
                this.idContainer.push([
                    "whiteRow" + myrowId.toString(),
                    this.layout[p].blockNumber
                ]);

                // if (this.layout[p].blockNumber > MusicKeyboard.FAKEBLOCKNUMBER) {
                // } -- empty block
                if (SOLFEGENAMES.indexOf(this.layout[p].noteName) !== -1) {
                    newel.innerHTML =
                        "<small>(" +
                        String.fromCharCode(MusicKeyboard.WHITEKEYS[myrowId]) +
                        ")</small><br/>" +
                        i18nSolfege(this.layout[p].noteName) +
                        this.layout[p].noteOctave;
                } else {
                    newel.innerHTML =
                        "<small>(" +
                        String.fromCharCode(MusicKeyboard.WHITEKEYS[myrowId]) +
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
        parenttbl = document.getElementById("myrow");
        newel = document.createElement("td");
        parenttbl.appendChild(newel);
        newel.style.textAlign = "center";
        newel.setAttribute("id", "rest");
        newel.setAttribute("alt", "R__");
        newel.innerHTML =
            "<small>(" +
            // .TRANS: a rest is a pause in the music.
            _("rest") +
            ")</small><br/>";
        newel.style.position = "relative";
        newel.style.zIndex = "100";

        for (let i = 0; i < this.idContainer.length; i++) {
            // If the blockNumber is null, don't make the key clickable.
            if (this.layout[i].blockNumber === null) {
                console.log("skipping " + i);
                continue;
            }
            this.loadHandler(
                document.getElementById(this.idContainer[i][0]),
                i,
                this.idContainer[i][1]
            );
        }

        this.addKeyboardShortcuts();
    }

    _save() {
        this.processSelected();
        console.debug("Generating action stack for: ");
        console.debug(MusicKeyboard.selectedNotes);
        const newStack = [
            [0, ["action", { collapsed: false }], 100, 100, [null, 1, 2, null]],
            [1, ["text", { value: _("action") }], 0, 0, [0]],
            [2, "hidden", 0, 0, [0, MusicKeyboard.selectedNotes.length == 0 ? null : 3]]
        ];

        // This function organizes notes into groups with same voices.
        // We need to cluster adjacent notes with same voice to wrap
        // "settimbre" block .  eg, piano-do piano-re piano-mi
        // guitar-fa piano-sol piano-la piano-ti --> piano-[do re mi]
        // guitar-fa piano-[la ti]
        this._clusterNotes = (selectedNotes) => {
            let i = 0;
            const newNotes = [];
            let prevNote = "electronic synth";
            while (i < selectedNotes.length) {
                if (i === 0) {
                    newNotes.push([i]);
                    if (selectedNotes[i].noteOctave[0] !== "drumnull") {
                        prevNote = selectedNotes[i].voice[0];
                    }
                } else if (selectedNotes[i].noteOctave[0] === "drumnull") {
                    // Don't trigger a new group with a drum block.
                    newNotes[newNotes.length - 1].push(i);
                } else if (selectedNotes[i].voice[0] != prevNote) {
                    newNotes.push([i]);
                    prevNote = selectedNotes[i].voice[0];
                } else {
                    newNotes[newNotes.length - 1].push(i);
                    prevNote = selectedNotes[i].voice[0];
                }
                i++;
            }
            return newNotes;
        };

        // Find the position of next setTimbre block
        this.findLen = (selectedNotesGrp, selectedNotes) => {
            let ans = 0;
            for (let i = 0; i < selectedNotesGrp.length; i++) {
                let note = selectedNotes[selectedNotesGrp[i]];
                if (note.noteOctave[0] === "R") {
                    ans += 6; // rest note uses 6
                } else if (note.noteOctave[0] === null) {
                    ans += 7; // drum note uses 7
                } else {
                    ans += 5 + 3 * note.noteOctave.length; // notes with pitches
                }
            }
            return ans;
        };

        const newNotes = this._clusterNotes(MusicKeyboard.selectedNotes);

        let prevId = 2;
        let endOfStackIdx, id;

        for (let noteGrp = 0; noteGrp < newNotes.length; noteGrp++) {
            const selectedNotesGrp = newNotes[noteGrp];
            const isLast = noteGrp == newNotes.length - 1;
            id = newStack.length;
            const voice = MusicKeyboard.selectedNotes[selectedNotesGrp[0]].voice[0] || DEFAULTVOICE;
            // eslint-disable-next-line max-len
            const next = isLast ? null : id + 3 + this.findLen(selectedNotesGrp, MusicKeyboard.selectedNotes);

            newStack.push(
                [id, "settimbre", 0, 0, [prevId, id + 1, id + 3, id + 2]],
                [id + 1, ["voicename", { value: voice }], 0, 0, [id]],
                [id + 2, "hidden", 0, 0, [id, next]]
            );

            prevId = id + 2;
            endOfStackIdx = id;

            for (let i = 0; i < selectedNotesGrp.length; i++) {
                const note = MusicKeyboard.selectedNotes[selectedNotesGrp[i]];

                // Add the Note block and its value
                const idx = newStack.length;
                newStack.push([idx, "newnote", 0, 0, [endOfStackIdx, idx + 2, idx + 1, null]]);
                const n = newStack[idx][4].length;
                if (i === 0) {
                    // the action block
                    newStack[endOfStackIdx][4][n - 2] = idx;
                } else {
                    // the previous note block
                    newStack[endOfStackIdx][4][n - 1] = idx;
                }

                endOfStackIdx = idx;

                const delta = 5;

                // Add a vspace to prevent divide block from obscuring the pitch block.
                newStack.push([idx + 1, "vspace", 0, 0, [idx, idx + delta]]);

                // note value is saved as a fraction
                newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);
                const maxWidth = Math.max.apply(Math, note.duration);

                const obj = toFraction(maxWidth);
                newStack.push([idx + 3, ["number", { value: obj[0] }], 0, 0, [idx + 2]]);
                newStack.push([idx + 4, ["number", { value: obj[1] }], 0, 0, [idx + 2]]);

                let thisBlock = idx + delta;

                // We need to point to the previous note or pitch block.
                let previousBlock = idx + 1; // Note block

                // The last connection in last pitch block is null.
                const lastConnection = null;

                if (note.noteOctave[0] === "R") {
                    newStack.push([thisBlock + 1, "rest2", 0, 0, [previousBlock, lastConnection]]);
                } else if (note.noteOctave[0] === "drumnull") {
                    newStack.push([
                        thisBlock,
                        "playdrum",
                        0,
                        0,
                        [previousBlock, thisBlock + 1, lastConnection]
                    ]);
                    newStack.push([
                        thisBlock + 1,
                        [
                            "drumname",
                            {
                                value: note.voice[0]
                            }
                        ],
                        0,
                        0,
                        [thisBlock]
                    ]);
                } else {
                    for (let j = 0; j < note.noteOctave.length; j++) {
                        if (j > 0) {
                            if (typeof note.noteOctave[j - 1] === "string") {
                                thisBlock = previousBlock + 3;
                            } else {
                                thisBlock = previousBlock + 2;
                            }
                            const n = newStack[previousBlock][4].length;
                            newStack[previousBlock][4][n - 1] = thisBlock;
                        }
                        if (typeof note.noteOctave[j] === "string") {
                            newStack.push([
                                thisBlock,
                                "pitch",
                                0,
                                0,
                                [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]
                            ]);
                            if (["#", "b", "♯", "♭"].indexOf(note.noteOctave[j][1]) !== -1) {
                                newStack.push([
                                    thisBlock + 1,
                                    [
                                        "solfege",
                                        {
                                            value:
                                                SOLFEGECONVERSIONTABLE[note.noteOctave[j][0]] +
                                                note.noteOctave[j][1]
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
                                            value: note.noteOctave[j][note.noteOctave[j].length - 1]
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
                                            value: SOLFEGECONVERSIONTABLE[note.noteOctave[j][0]]
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
                                            value: note.noteOctave[j][note.noteOctave[j].length - 1]
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
        }

        logo.blocks.loadNewBlocks(newStack);
        logo.textMsg(_("New action block generated!"));
    }

    clearBlocks() {
        this.noteNames = [];
        this.octaves = [];
    }

    /**
     * @deprecated
     */
    _addButton(row, icon, iconSize, label) {
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
        cell.style.width = MusicKeyboard.BUTTONSIZE + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = platformColor.selectorBackground;

        cell.onmouseover = () => {
            this.style.backgroundColor = platformColor.selectorBackgroundHOVER;
        };

        cell.onmouseout = () => {
            this.style.backgroundColor = platformColor.selectorBackground;
        };

        return cell;
    }

    doMIDI() {
        let duration = 0;
        let startTime = 0;

        this.getElement = {};

        for (let idx = 0; idx < this.layout.length; idx++) {
            let key = this.layout[idx];
            this.getElement[key.noteName.toString() + key.noteOctave.toString()] = key.objId;
            this.getElement[FIXEDSOLFEGE1[key.noteName.toString()] + "" + key.noteOctave] =
                key.objId; //convet solfege to alphabetic.
        }

        const __startNote = (event, element) => {
            if (!element) return;
            startTime = event.timeStamp; // Milliseconds();
            element.style.backgroundColor = platformColor.orange;
            logo.synth.trigger(
                0,
                this.noteMapper[element.id],
                1,
                this.instrumentMapper[element.id],
                null,
                null
            );
        };

        const __endNote = (event, element) => {
            if (!element) return;

            const id = element.id;
            if (id.includes("blackRow")) {
                element.style.backgroundColor = "black";
            } else {
                element.style.backgroundColor = "white";
            }

            const now = event.timeStamp;
            duration = now - startTime;
            duration /= 1000;
            logo.synth.stopSound(
                0,
                this.instrumentMapper[element.id],
                this.noteMapper[element.id]
            );
            if (MusicKeyboard.beginnerMode === "true") {
                duration = parseFloat((Math.round(duration * 8) / 8).toFixed(3));
            } else {
                duration = parseFloat((Math.round(duration * 16) / 16).toFixed(4));
            }

            if (duration === 0) {
                duration = 0.125;
            } else if (duration < 0) {
                duration = -duration;
            }

            this._notesPlayed.push({
                startTime: startTime,
                noteOctave: this.noteMapper[element.id],
                objId: element.id,
                duration: duration,
                voice: this.instrumentMapper[element.id],
                blockNumber: this.blockNumberMapper[element.id]
            });
            this._createTable();
        };

        const numberToPitch = (num) => {
            const offset = 4;
            const octave = offset + Math.floor((num - 60) / 12);
            const pitch1 = NOTESSHARP[num % 12];
            const pitch2 = NOTESFLAT[num % 12];
            return [pitch1, pitch2, octave];
        };

        //event attributes : timeStamp , data
        //data : length -3 [0] : 144/128 : noteOn/NoteOff
        //                 [1] : noteNumber : middle C always 60
        //                 [2] : velocity ,(currently not used).

        const onMIDIMessage = (event) => {
            const pitchOctave = numberToPitch(event.data[1]);
            const pitch1 = pitchOctave[0];
            const pitch2 = pitchOctave[1];
            const octave = pitchOctave[2];
            const key =
                this.getElement[pitch1 + "" + octave] || this.getElement[pitch2 + "" + octave];
            if (event.data[0] == 144 && event.data[2] != 0) {
                __startNote(event, docById(key));
            } else {
                __endNote(event, docById(key));
            }
        };

        const onMIDISuccess = (midiAccess) => {
            // re-init widget
            if (this.midiON) {
                this.midiButton.style.background = "#00FF00";
                // logo.textMsg(_("MIDI device present."));
                return;
            }
            midiAccess.inputs.forEach((input) => {
                input.onmidimessage = onMIDIMessage;
            });
            if (midiAccess.inputs.size) {
                this.midiButton.style.background = "#00FF00";
                // logo.textMsg(_("MIDI device present."));
                this.midiON = true;
            } else {
                logo.textMsg(_("No MIDI device found."));
            }
        };

        const onMIDIFailure = () => {
            logo.errorMsg(_("Failed to get MIDI access in browser."));
            this.midiON = false;
        };

        if (navigator.requestMIDIAccess)
            navigator.requestMIDIAccess({ sysex: true })
                .then(onMIDISuccess, onMIDIFailure);
        else
            logo.errorMsg(_("Failed to get MIDI access in browser."));
    };

    fillChromaticGaps(noteList) {
        // Assuming list of either solfege or letter class of the form
        // sol4 or G4.  Each entry is a dictionary with noteName and
        // noteOctave.

        const newList = [];
        // Anything we don't recognize gets added to the end.
        const hertzList = [];
        const drumList = [];
        let obj = null;
        let fakeBlockNumber = MusicKeyboard.FAKEBLOCKNUMBER + 1;

        // Find the first non-Hertz note.
        for (let i = 0; i < noteList.length; i++) {
            if (noteList[i].noteName === "drum") {
                drumList.push(noteList[i]);
            } else if (noteList[i].noteName === "hertz") {
                hertzList.push(noteList[i]);
            } else {
                obj = [noteList[0].noteName, noteList[0].noteOctave];
                break;
            }
        }

        // Only Hertz, so nothing to do.
        if (obj === null) {
            return noteList;
        }

        obj[0] = convertFromSolfege(obj[0]);
        let j = 0;
        if (obj[0] !== "C") {
            // Pad the left side.
            for (let i = 0; i < PITCHES2.length; i++) {
                newList.push({
                    noteName: PITCHES2[i],
                    noteOctave: obj[1],
                    blockNumber: noteList[0].blockNumber,
                    voice: noteList[0].voice
                });
                j = i;
                if (PITCHES2[i] === obj[0]) break;
                if (PITCHES[i] === obj[0]) break;
                newList[i].blockNumber = fakeBlockNumber;
                fakeBlockNumber += 1;
            }
        } else {
            newList.push({
                noteName: obj[0],
                noteOctave: obj[1],
                blockNumber: noteList[0].blockNumber,
                voice: noteList[0].voice
            });
        }

        // Fill in any gaps
        let lastOctave = obj[1];
        let thisOctave;
        let lastVoice;
        for (let i = 1; i < noteList.length; i++) {
            if (noteList[i].noteName === "drum") {
                drumList.push(noteList[i]);
            } else if (noteList[i].noteName === "hertz") {
                hertzList.push(noteList[i]);
            } else {
                obj = [noteList[i].noteName, noteList[i].noteOctave];
                thisOctave = obj[1];
                lastVoice = noteList[i].voice;
                obj[0] = convertFromSolfege(obj[0]);
                let k = PITCHES.indexOf(obj[0]);
                if (k === -1) {
                    k = PITCHES2.indexOf(obj[0]);
                }
                if (thisOctave > lastOctave) {
                    k += 12;
                }

                if (k !== (j + 1) % 12) {
                    // Fill in the gaps
                    for (let l = j + 1; l < k; l++) {
                        if (l % 12 === 0) {
                            lastOctave += 1;
                        }
                        newList.push({
                            noteName: PITCHES2[l % 12],
                            noteOctave: lastOctave,
                            blockNumber: fakeBlockNumber,
                            voice: lastVoice
                        });
                        fakeBlockNumber += 1;
                    }
                }
                newList.push({
                    noteName: obj[0],
                    noteOctave: obj[1],
                    blockNumber: noteList[i].blockNumber,
                    voice: noteList[i].voice
                });
                lastOctave = thisOctave;
                j = k;
            }
        }

        // Pad out the end of the list.
        if (obj[0] !== "C") {
            let k = PITCHES.indexOf(obj[0]);
            if (k === -1) {
                k = PITCHES2.indexOf(obj[0]);
            }
            for (let i = (k + 1) % 12; i < PITCHES2.length; i++) {
                if (i === 0) break;
                newList.push({
                    noteName: PITCHES2[i],
                    noteOctave: obj[1],
                    blockNumber: fakeBlockNumber,
                    voice: lastVoice
                });
                fakeBlockNumber += 1;
            }
            obj[1] += 1;
            newList.push({
                noteName: "C",
                noteOctave: obj[1],
                blockNumber: fakeBlockNumber,
                voice: lastVoice
            });
            fakeBlockNumber += 1;
        }

        for (let i = 0; i < hertzList.length; i++) {
            newList.push(hertzList[i]);
        }

        for (let i = 0; i < drumList.length; i++) {
            newList.push(drumList[i]);
        }

        return newList;
    }
}