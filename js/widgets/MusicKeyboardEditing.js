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

   docById, platformColor, last, debugLog, Singer, wheelnav, slicePath, getNote,
   noteToFrequency, i18nSolfege, convertFromSolfege, normalizeNoteAccidentals,
   FIXEDSOLFEGE1, DEFAULTVOICE, PREVIEWVOLUME
*/
/*
   Global locations
    - lib/wheelnav
        slicePath, wheelnav
    - js/utils/utils.js
        docById, last, debugLog
    - js/turtle-singer.js
        Singer
    - js/utils/musicutils.js
        getNote, noteToFrequency, i18nSolfege, convertFromSolfege,
        normalizeNoteAccidentals, FIXEDSOLFEGE1, DEFAULTVOICE
    - js/utils/platformstyle.js
        platformColor
    - js/logo.js
        PREVIEWVOLUME
*/

/* exported MusicKeyboardEditing */

/**
 * @file MusicKeyboardEditing.js
 * @description Note editing for the Music Keyboard widget: the pie menus that change,
 * divide and delete notes and edit columns, adding and removing pitch rows, and keeping
 * the layout sorted and in step with the pitch blocks.
 */

const MusicKeyboardEditing = {
    /**
     * Adds the editing methods to a MusicKeyboard instance.
     *
     * Call it with the instance as `this`:
     * `MusicKeyboardEditing.install.call(keyboard, deps)`. The methods keep the same
     * `this` binding they had inside the MusicKeyboard constructor, arrow functions
     * included.
     *
     * @param {Object} deps - Values from the MusicKeyboard constructor's scope.
     * @param {number} deps.FAKEBLOCKNUMBER - Block numbers at or above this are padding keys.
     * @param {string} deps.beginnerMode - localStorage.beginnerMode when the widget was made.
     * @param {Function} deps.resolveSynthNoteName - Maps a note name and octave to a synth note.
     * @param {Function} deps.fillChromaticGaps - Pads a note list out to a chromatic layout.
     * @returns {void}
     */
    install(deps) {
        const { FAKEBLOCKNUMBER, beginnerMode, resolveSynthNoteName, fillChromaticGaps } = deps;

        // Semitones for the pitch rows Add Note can create: C1 to B8.
        const LOWESTSTEP = 1 * 12;
        const HIGHESTSTEP = 8 * 12 + 11;
        const LETTERSTEPS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        const ACCIDENTALSTEPS = { "♯": 1, "#": 1, "♭": -1, "b": -1, "𝄪": 2, "𝄫": -2 };

        /**
         * Returns a pitch as a count of semitones (octave * 12 + semitone), whether
         * the row is named in solfege (`sol♯`) or with a letter (`G♯`).
         * @param {string} noteName
         * @param {number|string} octave
         * @returns {number} NaN if the name isn't a pitch.
         */
        const semitoneStep = (noteName, octave) => {
            const name = convertFromSolfege(String(noteName));
            let step = LETTERSTEPS[name.charAt(0)];
            if (step === undefined) {
                return NaN;
            }
            for (const accidental of name.slice(1)) {
                step += ACCIDENTALSTEPS[accidental] || 0;
            }
            return Number(octave) * 12 + step;
        };

        /**
         * Creates and configures a wheelnav "exit" (close) wheel sharing the given
         * Raphael canvas. Does not call createWheel() or attach a navigateFunction;
         * callers finish setup with their own labels and close behavior, since
         * those differ slightly between call sites.
         * @param {Object} raphael - The Raphael canvas shared with the parent wheel(s).
         * @param {number} maxRadiusPercent - The outer radius percent for this wheel.
         * @returns {Object} The configured (but not yet built) wheelnav instance.
         */
        this._createExitWheel = (raphael, maxRadiusPercent) => {
            const exitWheel = new wheelnav("_exitWheel", raphael);
            exitWheel.colors = platformColor.exitWheelcolors;
            exitWheel.slicePathFunction = slicePath().DonutSlice;
            exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            exitWheel.slicePathCustom.minRadiusPercent = 0.0;
            exitWheel.slicePathCustom.maxRadiusPercent = maxRadiusPercent;
            exitWheel.sliceSelectedPathCustom = exitWheel.slicePathCustom;
            exitWheel.sliceInitPathCustom = exitWheel.slicePathCustom;
            exitWheel.clickModeRotate = false;
            exitWheel.selectedNavItemIndex = null;
            return exitWheel;
        };

        this._configureExitWheel = exitWheel => {
            if (typeof window.configureExitWheel === "function") {
                window.configureExitWheel(exitWheel);
            }
        };

        /**
         * Creates a pie submenu based on the cell's attributes.
         * @param {string} cellId - The ID of the cell triggering the submenu.
         * @param {string} start - The start attribute of the cell.
         */
        this._createpiesubmenu = function (cellId, start) {
            docById("wheelDivptm").style.display = "";
            docById("wheelDivptm").style.zIndex = "10001";

            this._menuWheel = new wheelnav("wheelDivptm", null, 600, 600);
            this._exitWheel = this._createExitWheel(this._menuWheel.raphael, 0.2);
            this._exitWheel.keynavigateEnabled = false;

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
            this._exitWheel.navItems[1].enabled = false;
            if (this._exitWheel.navItems[0].sliceSelectedAttr) {
                this._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
                this._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
                this._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
                this._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
            }
            this._configureExitWheel(this._exitWheel);

            docById("wheelDivptm").style.position = "absolute";
            docById("wheelDivptm").style.height = "250px";
            docById("wheelDivptm").style.width = "250px";

            const x = docById(cellId).getBoundingClientRect().x;
            const y = docById(cellId).getBoundingClientRect().y;

            docById("wheelDivptm").style.left =
                Math.min(
                    this.activity.canvas.width - 200,
                    Math.max(0, x * this.activity.getStageScale())
                ) + "px";
            docById("wheelDivptm").style.top =
                Math.min(
                    this.activity.canvas.height - 250,
                    Math.max(0, y * this.activity.getStageScale())
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
                        docById("wheelnav-wheelDivptm-title-3").children[0].textContent =
                            this.newNoteValue;
                        this._tabsWheel.navItems[i].navItem.show();
                    }

                    flag = 1;
                } else {
                    for (let i = 12; i < 19; i++) {
                        docById("wheelnav-wheelDivptm-title-3").children[0].textContent =
                            this.newNoteValue;
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
        };

        /**
         * Updates the duration of notes with the specified start time.
         * @param {string} start - The start time of the notes to update.
         * @param {number[]} duration - The new duration expressed as a fraction [numerator, denominator].
         */
        this._updateDuration = function (start, duration) {
            start = parseInt(start, 10);
            duration = parseInt(duration[0], 10) / parseInt(duration[1], 10);
            const newduration = parseFloat((Math.round(duration * 8) / 8).toFixed(3));
            this._notesPlayed = this._notesPlayed.map(function (item) {
                if (item.startTime === start) {
                    item.duration = newduration;
                }

                return item;
            });
            this._createTable();
        };

        /**
         * Adds notes by dividing the existing note at the specified start time.
         * @param {string} cellId - The ID of the cell where notes will be added.
         * @param {string} start - The start time of the note to divide.
         * @param {number} divideNoteBy - The number of divisions to create from the note.
         */
        this._addNotes = function (cellId, start, divideNoteBy) {
            start = parseInt(start, 10);
            const cell = docById(cellId);
            const dur = cell.getAttribute("dur");

            this._notesPlayed = this._notesPlayed.reduce(function (prevValue, curValue) {
                let oldcurValue, newcurValue;
                if (parseInt(curValue.startTime, 10) === start) {
                    prevValue = prevValue.concat([curValue]);
                    oldcurValue = Object.assign({}, curValue);
                    for (let i = 0; i < divideNoteBy; i++) {
                        newcurValue = Object.assign({}, oldcurValue);
                        newcurValue.startTime = oldcurValue.startTime + oldcurValue.duration * 1000;
                        prevValue = prevValue.concat([newcurValue]);
                        oldcurValue = newcurValue;
                    }

                    return prevValue;
                } else if (parseInt(curValue.startTime, 10) > start) {
                    curValue.startTime = curValue.startTime + dur * 1000 * divideNoteBy;
                    return prevValue.concat([curValue]);
                }

                return prevValue.concat([curValue]);
            }, []);

            this._createTable();
        };

        /**
         * Deletes notes with the specified start time.
         * @param {string} start - The start time of the notes to delete.
         */
        this._deleteNotes = function (start) {
            start = parseInt(start, 10);

            this._notesPlayed = this._notesPlayed.filter(function (ele) {
                return parseInt(ele.startTime, 10) !== start;
            });

            this._createTable();
        };

        /**
         * Divides a note at the specified start time into multiple notes.
         * @param {string} start - The start time of the note to divide.
         * @param {number} divideNoteBy - The number of divisions to create from the note.
         */
        this._divideNotes = function (start, divideNoteBy) {
            start = parseInt(start, 10);

            this._notesPlayed = this._notesPlayed.reduce(function (prevValue, curValue) {
                let newcurValue, newcurValue2, oldcurValue;
                if (parseInt(curValue.startTime, 10) === start) {
                    if (beginnerMode === "true") {
                        if (curValue.duration / divideNoteBy < 0.125) {
                            return prevValue.concat([curValue]);
                        }
                    } else {
                        if (curValue.duration / divideNoteBy < 0.0625) {
                            return prevValue.concat([curValue]);
                        }
                    }

                    newcurValue = Object.assign({}, curValue);
                    newcurValue.duration = curValue.duration / divideNoteBy;
                    prevValue = prevValue.concat([newcurValue]);
                    oldcurValue = newcurValue;
                    for (let i = 0; i < divideNoteBy - 1; i++) {
                        newcurValue2 = Object.assign({}, oldcurValue);
                        newcurValue2.startTime = parseInt(
                            newcurValue2.startTime + newcurValue2.duration * 1000,
                            10
                        );
                        prevValue = prevValue.concat([newcurValue2]);
                        oldcurValue = newcurValue2;
                    }

                    return prevValue;
                }

                return prevValue.concat([curValue]);
            }, []);

            this._createTable();
        };

        /**
         * Creates a submenu for adding a new row.
         * The submenu allows selection between pitch and hertz options.
         */
        this._createAddRowPieSubmenu = function () {
            docById("wheelDivptm").style.display = "";
            docById("wheelDivptm").style.zIndex = "10001";
            const pitchLabels = [
                "do",
                "do♯",
                "re",
                "re♯",
                "mi",
                "fa",
                "fa♯",
                "sol",
                "sol♯",
                "la",
                "la♯",
                "ti"
            ];
            const hertzLabels = [262, 294, 327, 348, 392, 436, 490, 523];
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
            this._exitWheel = this._createExitWheel(this._menuWheel.raphael, 0.25);

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

            this._exitWheel.createWheel(["×", " "]);
            this._exitWheel.navItems[1].enabled = false;
            if (this._exitWheel.navItems[0].sliceSelectedAttr) {
                this._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
                this._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
                this._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
                this._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
            }
            this._configureExitWheel(this._exitWheel);

            const x = docById("addnotes").getBoundingClientRect().x;
            const y = docById("addnotes").getBoundingClientRect().y;

            docById("wheelDivptm").style.position = "absolute";
            docById("wheelDivptm").style.height = "300px";
            docById("wheelDivptm").style.width = "300px";
            docById("wheelDivptm").style.left =
                Math.min(
                    this.activity.canvas.width - 200,
                    Math.max(0, x * this.activity.getStageScale())
                ) + "px";
            docById("wheelDivptm").style.top =
                Math.min(
                    this.activity.canvas.height - 300,
                    Math.max(0, y * this.activity.getStageScale())
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
                const newBlock = this.activity.blocks.blockList.length;

                if (label === "pitch") {
                    // The chromatic gap-fill adds padding rows with letter names and
                    // block numbers at or above FAKEBLOCKNUMBER. Only the real pitch
                    // rows count, compared by pitch rather than by name, and the new
                    // note is the next semitone above the highest one.
                    const taken = new Set(
                        this.layout
                            .filter(
                                note =>
                                    note.noteName !== "hertz" &&
                                    note.noteName !== "drum" &&
                                    note.blockNumber < FAKEBLOCKNUMBER
                            )
                            .map(note => semitoneStep(note.noteName, note.noteOctave))
                            .filter(step => !isNaN(step))
                    );

                    let step = taken.size > 0 ? Math.max(...taken) + 1 : 4 * 12;
                    if (step > HIGHESTSTEP) {
                        // Nothing above the top note: use the lowest free one.
                        step = LOWESTSTEP;
                        while (step <= HIGHESTSTEP && taken.has(step)) {
                            step++;
                        }
                        if (step > HIGHESTSTEP) {
                            this.activity.errorMsg(
                                _("All 12 pitches are already in the keyboard. Adding duplicate.")
                            );
                            step = HIGHESTSTEP;
                        }
                    }

                    rLabel = pitchLabels[step % 12];
                    rArg = Math.floor(step / 12);
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
                        this.activity.blocks.loadNewBlocks([
                            [0, ["pitch", {}], 0, 0, [null, 1, 2, null]],
                            [1, ["solfege", { value: rLabel }], 0, 0, [0]],
                            [2, ["number", { value: rArg }], 0, 0, [0]]
                        ]);
                        break;
                    case "hertz":
                        this.activity.blocks.loadNewBlocks([
                            [0, ["hertz", {}], 0, 0, [null, 1, null]],
                            [1, ["number", { value: rArg }], 0, 0, [0]]
                        ]);
                        break;
                    default:
                        debugLog("Nothing to do for " + label);
                }

                let aboveBlock = -1;
                for (let i = this.layout.length; i > 0; i--) {
                    if (this.layout[i - 1].blockNumber < FAKEBLOCKNUMBER) {
                        aboveBlock = this.layout[i - 1].blockNumber;
                        break;
                    }
                }
                if (aboveBlock !== -1) {
                    creatingNewNote = true;
                    this._setWidgetTimeout(() => {
                        this._addNotesBlockBetween(aboveBlock, newBlock);
                        creatingNewNote = false;
                        this.layout.push({
                            noteName: rLabel,
                            noteOctave: rArg,
                            blockNumber: newBlock,
                            voice: this.layout[0].voice
                        });
                        this._sortLayout(this.layout);

                        this._syncLayouts();

                        this._createKeyboard();
                        this._createTable();
                        const n = this.layout.length;
                        const key = this.layout[n - 1];
                        if (!this.noteToKeyMap) {
                            this.noteToKeyMap = {};
                        }
                        if (key) {
                            this.noteToKeyMap[key.noteName.toString() + key.noteOctave.toString()] =
                                key.objId;
                            if (FIXEDSOLFEGE1 && FIXEDSOLFEGE1[key.noteName.toString()]) {
                                this.noteToKeyMap[
                                    FIXEDSOLFEGE1[key.noteName.toString()] + "" + key.noteOctave
                                ] = key.objId; //convet solfege to alphabetic.
                            }
                        }
                    }, 500);
                } else {
                    debugLog("Could not find anywhere to insert new block.");
                }
            };

            for (let i = 0; i < valueLabel.length; i++) {
                this._menuWheel.navItems[i].navigateFunction = __selectionChanged;
            }
        };

        /**
         * Adds a new block between two existing blocks in the activity.
         * @param {number} aboveBlock - The block number above which the new block will be inserted.
         * @param {number} block - The block number of the new block to be inserted.
         */
        this._addNotesBlockBetween = function (aboveBlock, block) {
            const belowBlock = last(this.activity.blocks.blockList[aboveBlock].connections);
            this.activity.blocks.blockList[aboveBlock].connections[
                this.activity.blocks.blockList[aboveBlock].connections.length - 1
            ] = block;

            if (belowBlock !== null) {
                this.activity.blocks.blockList[belowBlock].connections[0] = block;
            }

            this.activity.blocks.blockList[block].connections[0] = aboveBlock;

            this.activity.blocks.blockList[block].connections[
                this.activity.blocks.blockList[block].connections.length - 1
            ] = belowBlock;

            if (this.blockNo !== undefined && this.blockNo !== null) {
                this.activity.blocks.adjustDocks(this.blockNo, true);
                this.activity.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
            }
            this.activity.blocks.adjustExpandableClampBlock();
            this.activity.refreshCanvas();
        };

        /**
         * Sorts the layout of notes based on their frequency values.
         * Removes duplicate notes and adjusts connections accordingly.
         */
        this._sortLayout = function () {
            this.layout.sort((a, b) => {
                let aValue, bValue;
                if (a.noteName === "hertz") {
                    if (b.noteName !== "hertz") return 1;
                    aValue = a.noteOctave;
                } else {
                    aValue = noteToFrequency(
                        convertFromSolfege(a.noteName) + a.noteOctave,
                        this.activity.turtles.ithTurtle(0).singer.keySignature
                    );
                }
                if (b.noteName === "hertz") {
                    if (a.noteName !== "hertz") return -1;
                    bValue = b.noteOctave;
                } else {
                    bValue = noteToFrequency(
                        convertFromSolfege(b.noteName) + b.noteOctave,
                        this.activity.turtles.ithTurtle(0).singer.keySignature
                    );
                }

                if (aValue === bValue) {
                    return a.blockNumber - b.blockNumber;
                }
                return aValue - bValue;
            });

            // Use Set for O(1) lookup instead of Array.includes() O(n)
            const unique = new Set();
            this.remove = [];
            this.layout = this.layout.filter((item, pos) => {
                const key = item.noteName + item.noteOctave;
                if (!unique.has(key)) {
                    unique.add(key);
                    return true;
                }

                this.remove = [this.layout[pos - 1].blockNumber, this.layout[pos].blockNumber];
                return false;
            });

            this._notesPlayed.map(item => {
                if (item.objId === this.remove[1]) {
                    item.objId = this.remove[0];
                }

                return item;
            });

            if (this.remove.length) {
                this._removePitchBlock(this.remove[1]);
            }

            this._syncLayouts();

            if (this.keyboardShown) {
                this._createKeyboard();
            } else {
                this._createTable();
            }
        };

        /**
         * Synchronizes this.layout and this.displayLayout, ensuring all notes
         * are aligned, gap-filled, and that real note blocks preserve their
         * original solfege names and blockNumbers.
         */
        this._syncLayouts = function () {
            const originalLayout = this.layout.filter(note => note.blockNumber < FAKEBLOCKNUMBER);

            // Gap-fill from the real rows only. The padding rows are rebuilt here,
            // and keeping the old ones would duplicate a row added on top of one.
            this.displayLayout = originalLayout.map(note => {
                return { ...note, noteName: convertFromSolfege(note.noteName) };
            });

            const sortedHertzList = this.displayLayout.filter(note => note.noteName === "hertz");
            const sortedNotesList = this.displayLayout.filter(note => note.noteName !== "hertz");
            this.displayLayout = fillChromaticGaps(sortedNotesList);
            this.displayLayout = this.displayLayout.concat(sortedHertzList);

            const originalNotesMap = {};
            for (const note of originalLayout) {
                const alphaName = convertFromSolfege(note.noteName);
                originalNotesMap[alphaName + note.noteOctave] = note;
            }

            this.displayLayout = this.displayLayout.map(note => {
                const key = note.noteName + note.noteOctave;
                if (originalNotesMap[key]) {
                    return {
                        ...note,
                        blockNumber: originalNotesMap[key].blockNumber
                    };
                }
                return { ...note };
            });

            this.layout = this.displayLayout.map(note => {
                const key = note.noteName + note.noteOctave;
                if (originalNotesMap[key]) {
                    return { ...originalNotesMap[key] };
                }
                return { ...note };
            });
        };

        /**
         * Removes a pitch block from the activity and adjusts connections.
         * @param {number} blockNo - The block number of the pitch block to be removed.
         */
        this._removePitchBlock = function (blockNo) {
            if (
                blockNo === undefined ||
                blockNo === null ||
                !this.activity ||
                !this.activity.blocks ||
                !this.activity.blocks.blockList
            ) {
                return;
            }

            const block = this.activity.blocks.blockList[blockNo];
            if (!block || !Array.isArray(block.connections) || block.connections.length < 2) {
                return;
            }

            const c0 = block.connections[0];
            const c1 = last(block.connections);

            const parentBlock =
                c0 !== null && c0 !== undefined && this.activity.blocks.blockList[c0]
                    ? this.activity.blocks.blockList[c0]
                    : null;
            const childBlock =
                c1 !== null && c1 !== undefined && this.activity.blocks.blockList[c1]
                    ? this.activity.blocks.blockList[c1]
                    : null;

            const nextChildId = childBlock ? c1 : null;
            const nextParentId = parentBlock ? c0 : null;

            if (
                parentBlock &&
                Array.isArray(parentBlock.connections) &&
                parentBlock.connections.length > 0
            ) {
                if (parentBlock.name === "musickeyboard" && parentBlock.connections.length > 1) {
                    parentBlock.connections[1] = nextChildId;
                } else {
                    parentBlock.connections[parentBlock.connections.length - 1] = nextChildId;
                }
            }

            if (
                childBlock &&
                Array.isArray(childBlock.connections) &&
                childBlock.connections.length > 0
            ) {
                childBlock.connections[0] = nextParentId;
            }

            block.connections[block.connections.length - 1] = null;
            this.activity.blocks.sendStackToTrash(block);
            if (this.blockNo !== undefined && this.blockNo !== null) {
                if (typeof this.activity.blocks.adjustDocks === "function") {
                    this.activity.blocks.adjustDocks(this.blockNo, true);
                }
                if (Array.isArray(this.activity.blocks.clampBlocksToCheck)) {
                    this.activity.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
                }
            }
            if (typeof this.activity.refreshCanvas === "function") {
                this.activity.refreshCanvas();
            }
        };

        /**
         * Creates a column pie submenu based on the provided index and condition.
         * @param {number} index - The index used to retrieve block information.
         * @param {string} condition - The condition that determines the type of submenu to create ('synthsblocks' or 'pitchblocks').
         */
        this._createColumnPieSubmenu = function (index, condition) {
            index = parseInt(index, 10);
            const displayLayout = this.displayLayout || this.layout;
            const layoutItem = displayLayout[displayLayout.length - index - 1];

            if (!layoutItem) {
                return;
            }
            if (this.activity.blocks.blockList[layoutItem.blockNumber] === undefined) {
                return;
            }

            docById("wheelDivptm").style.display = "";
            docById("wheelDivptm").style.zIndex = "10001";

            const accidentals = ["𝄪", "♯", "♮", "♭", "𝄫"];
            let noteLabels = ["ti", "la", "sol", "fa", "mi", "re", "do"];
            const noteLabelsI18n = [];
            for (let i = 0; i < noteLabels.length; i++) {
                noteLabelsI18n.push(i18nSolfege(noteLabels[i]));
            }

            if (condition === "synthsblocks") {
                noteLabels = ["261", "294", "327", "348", "392", "436", "490", "523"];
            }

            this._pitchWheel = new wheelnav("wheelDivptm", null, 600, 600);

            this._exitWheel = this._createExitWheel(this._pitchWheel.raphael, 0.2);
            if (condition === "pitchblocks") {
                this._accidentalsWheel = new wheelnav(
                    "_accidentalsWheel",
                    this._pitchWheel.raphael
                );
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

            this._exitWheel.createWheel(["x", " "]);
            this._exitWheel.navItems[1].enabled = false;
            if (this._exitWheel.navItems[0].sliceSelectedAttr) {
                this._exitWheel.navItems[0].sliceSelectedAttr.cursor = "pointer";
                this._exitWheel.navItems[0].sliceHoverAttr.cursor = "pointer";
                this._exitWheel.navItems[0].titleSelectedAttr.cursor = "pointer";
                this._exitWheel.navItems[0].titleHoverAttr.cursor = "pointer";
            }
            this._configureExitWheel(this._exitWheel);

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
                this._accidentalsWheel.sliceSelectedPathCustom =
                    this._accidentalsWheel.slicePathCustom;
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
                if (typeof this._accidentalsWheel.setTooltips === "function") {
                    this._accidentalsWheel.setTooltips([
                        _("double sharp"),
                        _("sharp"),
                        _("natural"),
                        _("flat"),
                        _("double flat")
                    ]);
                }

                this._octavesWheel.colors = platformColor.octavesWheelcolors;
                this._octavesWheel.slicePathFunction = slicePath().DonutSlice;
                this._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
                this._octavesWheel.slicePathCustom.minRadiusPercent = 0.75;
                this._octavesWheel.slicePathCustom.maxRadiusPercent = 0.95;
                this._octavesWheel.sliceSelectedPathCustom = this._octavesWheel.slicePathCustom;
                this._octavesWheel.sliceInitPathCustom = this._octavesWheel.slicePathCustom;
                this._octavesWheel.animatetime = 0; // 300;
                this._octavesWheel.createWheel(octaveLabels);
                if (typeof this._octavesWheel.setTooltips === "function") {
                    this._octavesWheel.setTooltips([
                        _("Octave 8 (Shift+↑/↓ to shift octaves)"),
                        _("Octave 7 (Shift+↑/↓ to shift octaves)"),
                        _("Octave 6 (Shift+↑/↓ to shift octaves)"),
                        _("Octave 5 (Shift+↑/↓ to shift octaves)"),
                        _("Octave 4 (Shift+↑/↓ to shift octaves)"),
                        _("Octave 3 (Shift+↑/↓ to shift octaves)"),
                        _("Octave 2 (Shift+↑/↓ to shift octaves)"),
                        _("Octave 1 (Shift+↑/↓ to shift octaves)")
                    ]);
                }
            }

            const x = docById("labelcol" + index).getBoundingClientRect().x;
            const y = docById("labelcol" + index).getBoundingClientRect().y;

            docById("wheelDivptm").style.position = "absolute";
            docById("wheelDivptm").style.height = "300px";
            docById("wheelDivptm").style.width = "300px";
            docById("wheelDivptm").style.left =
                Math.min(
                    this.activity.canvas.width - 200,
                    Math.max(0, x * this.activity.getStageScale())
                ) + "px";
            docById("wheelDivptm").style.top =
                Math.min(
                    this.activity.canvas.height - 300,
                    Math.max(0, y * this.activity.getStageScale())
                ) + "px";

            index = displayLayout.length - index - 1;
            const block = displayLayout[index].blockNumber;

            let noteValue =
                this.activity.blocks.blockList[this.activity.blocks.blockList[block].connections[1]]
                    .value;

            if (typeof noteValue === "string") {
                if (noteValue.endsWith("##") || noteValue.endsWith("x")) {
                    noteValue = noteValue.replace(/(##|x)$/, "𝄪");
                } else if (noteValue.endsWith("#")) {
                    noteValue = noteValue.replace(/#$/, "♯");
                } else if (noteValue.endsWith("bb")) {
                    noteValue = noteValue.replace(/bb$/, "𝄫");
                } else if (noteValue.endsWith("b")) {
                    noteValue = noteValue.replace(/b$/, "♭");
                }
            }

            if (condition === "pitchblocks") {
                const octaveValue =
                    this.activity.blocks.blockList[
                        this.activity.blocks.blockList[block].connections[2]
                    ].value;
                let accidentalsValue = 2;

                for (let i = 0; i < accidentals.length; i++) {
                    if (noteValue.includes(accidentals[i])) {
                        accidentalsValue = i;
                        noteValue = noteValue.slice(0, noteValue.indexOf(accidentals[i]));
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
            };

            /**
             * Handles the hertz selection change for the pitch wheel.
             */
            const __hertzSelectionChanged = () => {
                const blockValue =
                    this._pitchWheel.navItems[this._pitchWheel.selectedNavItemIndex].title;
                const argBlock = this.activity.blocks.blockList[block].connections[1];
                this.activity.blocks.blockList[argBlock].text.text = blockValue;
                this.activity.blocks.blockList[argBlock].value = parseInt(blockValue, 10);

                const z = this.activity.blocks.blockList[argBlock].container.children.length - 1;
                this.activity.blocks.blockList[argBlock].container.setChildIndex(
                    this.activity.blocks.blockList[argBlock].text,
                    z
                );
                this.activity.blocks.blockList[argBlock].updateCache();

                const cell = docById("labelcol" + (displayLayout.length - index - 1));
                displayLayout[index].noteOctave = parseInt(blockValue, 10);
                if (this.layout[index]) {
                    this.layout[index].noteOctave = parseInt(blockValue, 10);
                }
                cell.textContent =
                    displayLayout[index].noteName + displayLayout[index].noteOctave.toString();
                this._notesPlayed.map(item => {
                    if (item.objId === displayLayout[index].blockNumber) {
                        item.noteOctave = parseInt(blockValue, 10);
                    }
                    return item;
                });
            };

            if (condition === "synthsblocks") {
                for (let i = 0; i < noteLabels.length; i++) {
                    this._pitchWheel.navItems[i].navigateFunction = __hertzSelectionChanged;
                }
            }

            /**
             * Handles the selection change event for the pitch wheel.
             * Updates the note label and octave based on the selected wheel values.
             */
            const __selectionChanged = () => {
                let label = this._pitchWheel.navItems[this._pitchWheel.selectedNavItemIndex].title;
                let labelValue, i, attr;
                if (condition === "pitchblocks") {
                    i = noteLabelsI18n.indexOf(label);
                    labelValue = noteLabels[i];
                    attr =
                        this._accidentalsWheel.navItems[this._accidentalsWheel.selectedNavItemIndex]
                            .title;
                    if (attr !== "♮") {
                        label += attr;
                    }
                } else {
                    i = noteLabels.indexOf(label);
                    labelValue = label;
                }

                const noteLabelBlock = this.activity.blocks.blockList[block].connections[1];
                this.activity.blocks.blockList[noteLabelBlock].text.text = label;
                this.activity.blocks.blockList[noteLabelBlock].value = labelValue;

                const z =
                    this.activity.blocks.blockList[noteLabelBlock].container.children.length - 1;
                this.activity.blocks.blockList[noteLabelBlock].container.setChildIndex(
                    this.activity.blocks.blockList[noteLabelBlock].text,
                    z
                );
                this.activity.blocks.blockList[noteLabelBlock].updateCache();

                let octave;
                if (condition === "pitchblocks") {
                    octave = Number(
                        this._octavesWheel.navItems[this._octavesWheel.selectedNavItemIndex].title
                    );
                    this.activity.blocks.blockList[noteLabelBlock].blocks.setPitchOctave(
                        this.activity.blocks.blockList[noteLabelBlock].connections[0],
                        octave
                    );
                }

                const cell = docById("labelcol" + (displayLayout.length - index - 1));
                displayLayout[index].noteName = label;
                displayLayout[index].noteOctave = octave;
                if (this.layout[index]) {
                    this.layout[index].noteName = label;
                    this.layout[index].noteOctave = octave;
                }
                cell.textContent =
                    displayLayout[index].noteName + displayLayout[index].noteOctave.toString();
                const temp1 = label;
                const temp2 = resolveSynthNoteName(temp1, octave);

                this._notesPlayed.map(item => {
                    if (item.objId === displayLayout[index].blockNumber) {
                        item.noteOctave = temp2;
                    }
                    return item;
                });
            };

            /**
             * Executes a pitch preview based on the current selection in the pitch wheel.
             * This function triggers a synthesized sound preview of the selected note.
             * After triggering the preview, it calls the __selectionChanged function to update UI elements.
             */
            const __pitchPreview = () => {
                const label =
                    this._pitchWheel.navItems[this._pitchWheel.selectedNavItemIndex].title;
                const i = noteLabelsI18n.indexOf(label);
                let labelValue = noteLabels[i];

                const attr =
                    this._accidentalsWheel.navItems[this._accidentalsWheel.selectedNavItemIndex]
                        .title;
                if (attr !== "♮") {
                    labelValue += attr;
                }

                const octave = Number(
                    this._octavesWheel.navItems[this._octavesWheel.selectedNavItemIndex].title
                );
                const obj = getNote(
                    labelValue,
                    octave,
                    0,
                    this.activity.turtles.ithTurtle(0).singer.keySignature,
                    false,
                    null,
                    this.activity.logo.errorMsg,
                    this.activity.logo.synth.inTemperament
                );
                this.activity.logo.synth.setMasterVolume(PREVIEWVOLUME);
                Singer.setSynthVolume(this.activity.logo, 0, DEFAULTVOICE, PREVIEWVOLUME);
                this.activity.logo.synth.trigger(
                    0,
                    [normalizeNoteAccidentals(obj[0] + obj[1])],
                    1 / 8,
                    DEFAULTVOICE,
                    null,
                    null
                );

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
        };
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicKeyboardEditing;
}
