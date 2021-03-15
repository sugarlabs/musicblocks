/**
 * @file This contains the prototype of the rhythmruler Widget
 *
 * @copyright 2016-19 Walter Bender
 * @copyright 2016 Hemant Kasat
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/*
   global TONEBPM, Singer, logo, _, delayExecution, docById, calcNoteValueToDisplay, platformColor,
   beginnerMode, last, EIGHTHNOTEWIDTH, nearestBeat, rationalToFraction, DRUMNAMES, VOICENAMES,
   EFFECTSNAMES
*/
/*
    Globals location
    - js/logo.js
        TONEBPM
    - js/turtle-singer.js
        Singer
    - js/utils/utils.js
        _,docById,delayExecution,last,nearestBeat,rationalToFraction
    - js/utils/musicutils.js
        calcNoteValueToDisplay,EIGHTHNOTEWIDTH
    - js/utils/platformstyle.js
        platformColor
    - js/activity.js
        beginnerMode
    - js/utils/synthutils.js
        DRUMNAMES,VOICENAMES,EFFECTSNAMES
*/
/* exported RhythmRuler */

/**
 * @abstract
 * This widget enable us to create a rhythms which can be imported into the pitch-time matrix and
 * hence used to create chunks of notes.
 *
 * @description
 * - `rulerButtonsDiv` is for the widget buttons
 * - `rulerTableDiv` is for the drum buttons (fixed first col) and the ruler cells
 */
class RhythmRuler {
    static RULERHEIGHT = 70;
    static BUTTONSIZE = 51;
    static ICONSIZE = 32;
    static DEL = 46;

    /**
     * @constructor
     */
    constructor() {
        // There is one ruler per drum.
        this.Drums = [];
        // Rulers, one per drum, contain the subdivisions defined by rhythm blocks.
        this.Rulers = [];
        // Save the history of divisions so as to be able to restore them.
        this._dissectHistory = [];
        this._undoList = [];

        this._playing = false;
        this._playingOne = false;
        this._playingAll = false;
        this._cellCounter = 0;

        // Keep a elapsed time for each ruler to maintain sync.
        this._elapsedTimes = [];
        // Starting time from which we measure for sync.
        this._startingTime = null;

        this._offsets = [];
        this._rulerSelected = 0;
        this._rulerPlaying = -1;

        this._tapMode = false;
        this._tapTimes = [];
        this._tapCell = null;
        this._tapEndTime = null;

        this._longPressStartTime = null;
        this._inLongPress = false;

        this._mouseDownCell = null;
        this._mouseUpCell = null;

        this._wheel = null;

        // Element references
        this._dissectNumber = null;
        this._progressBar = null;
        this._rulers = [];
        this._fullscreenScaleFactor = 3;
    }

    /**
     * Initialises the temperament widget.
     * @returns {void}
     */
    init() {
        // console.debug("init RhythmRuler");

        this._bpmFactor = (1000 * TONEBPM) / Singer.masterBPM;

        this._playing = false;
        this._playingOne = false;
        this._playingAll = false;
        this._rulerPlaying = -1;
        this._startingTime = null;
        this._expanded = false;

        // If there are no drums, add one.
        if (this.Drums.length === 0) {
            this.Drums.push(null);
            this.Rulers.push([[1], []]);
        }

        this._elapsedTimes = [];
        this._offsets = [];
        for (let i = 0; i < this.Rulers.length; i++) {
            this._elapsedTimes.push(0);
            this._offsets.push(0);
        }

        this._cellScale = 1.0;
        const iconSize = RhythmRuler.ICONSIZE;

        const widgetWindow = window.widgetWindows.windowFor(this, "rhythm maker");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        // For the button callbacks

        widgetWindow.onclose = () => {
            // If the piemenu was open, close it.
            // docById('wheelDiv').style.display = 'none';
            // docById('contextWheelDiv').style.display = 'none';

            // Save the new dissect history.
            const dissectHistory = [];
            const drums = [];
            for (let i = 0; i < this.Rulers.length; i++) {
                if (this.Drums[i] === null) {
                    continue;
                }

                const history = [];
                for (let j = 0; j < this.Rulers[i][1].length; j++) {
                    history.push(this.Rulers[i][1][j]);
                }

                this._dissectNumber.classList.add("hasKeyboard");
                dissectHistory.push([history, this.Drums[i]]);
                drums.push(this.Drums[i]);
            }

            // Look for any old entries that we may have missed.
            for (let i = 0; i < this._dissectHistory.length; i++) {
                const drum = this._dissectHistory[i][1];
                if (drums.indexOf(drum) === -1) {
                    const history = JSON.parse(JSON.stringify(this._dissectHistory[i][0]));
                    dissectHistory.push([history, drum]);
                }
            }

            this._dissectHistory = JSON.parse(JSON.stringify(dissectHistory));

            this._playing = false;
            this._playingOne = false;
            this._playingAll = false;
            logo.hideMsgs();

            this.widgetWindow.destroy();
        };

        this.widgetWindow.onmaximize = this._scale.bind(this);

        this._playAllCell = widgetWindow.addButton("play-button.svg", iconSize, _("Play all"));
        this._playAllCell.onclick = () => {
            if (this._playing) {
                this.__pause();
            } else if (!this._playingAll) {
                this.__resume();
            }
        };

        this._save_lock = false;
        widgetWindow.addButton(
            "export-chunk.svg",
            iconSize,
            _("Save rhythms")
        ).onclick = async () => {
            // this._save(0);
            // Debounce button
            if (!this._get_save_lock()) {
                this._save_lock = true;

                // Save a merged version of the rulers.
                this._saveTupletsMerged(this._mergeRulers());

                // Rather than each ruler individually.
                // this._saveTuplets(0);
                await delayExecution(1000);
                this._save_lock = false;
            }
        };

        widgetWindow.addButton(
            "export-drums.svg",
            iconSize,
            _("Save drum machine")
        ).onclick = async () => {
            // Debounce button
            if (!this._get_save_lock()) {
                this._save_lock = true;
                this._saveMachine(0);
                await delayExecution(1000);
                this._save_lock = false;
            }
        };

        // An input for setting the dissect number
        this._dissectNumber = widgetWindow.addInputButton("2");

        this._dissectNumber.onfocus = () => {
            // this._piemenuNumber(['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'], numberInput.value);
        };

        this._dissectNumber.onkeydown = (event) => {
            if (event.keyCode === RhythmRuler.DEL) {
                this._dissectNumber.value = this._dissectNumber.value.substring(
                    0,
                    this._dissectNumber.value.length - 1
                );
            }
        };

        this._dissectNumber.oninput = () => {
            // Put a limit on the size (2 <--> 128).
            this._dissectNumber.onmouseout = () => {
                this._dissectNumber.value = Math.max(this._dissectNumber.value, 2);
            };

            this._dissectNumber.value = Math.max(Math.min(this._dissectNumber.value, 128), 2);
        };

        widgetWindow.addButton("restore-button.svg", iconSize, _("Undo")).onclick = () => {
            this._undo();
        };

        //.TRANS: user can tap out a rhythm by clicking on a ruler.
        this._tapButton = widgetWindow.addButton("tap-button.svg", iconSize, _("Tap a rhythm"));
        this._tapButton.onclick = () => {
            this._tap();
        };

        //.TRANS: clear all subdivisions from the ruler.
        widgetWindow.addButton("erase-button.svg", iconSize, _("Clear")).onclick = () => {
            this._clear();
        };

        // We use an outer div to scroll vertically and an inner div to
        // scroll horizontally.
        const rhythmRulerTable = document.createElement("table");
        widgetWindow.getWidgetBody().append(rhythmRulerTable);

        let wMax = 0;
        // Each row in the ruler table contains a play button in the
        // first column and a ruler table in the second column.
        for (let i = 0; i < this.Rulers.length; i++) {
            const rhythmRulerTableRow = rhythmRulerTable.insertRow();

            if (beginnerMode) {
                let w = 0;
                for (let r = 0; r < this.Rulers[i][0].length; r++) {
                    w += 580 / this.Rulers[i][0][r];
                }

                if (w > wMax) {
                    rhythmRulerTable.style.width = w + "px";
                    wMax = w;
                }
            } else {
                const drumcell = rhythmRulerTableRow.insertCell();
                drumcell.innerHTML =
                    '<img src="header-icons/play-button.svg" title="' +
                    _("Play") +
                    '" alt="' +
                    _("Play") +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '" />';
                drumcell.className = "headcol"; // Position fixed when scrolling horizontally
                drumcell.style.cursor = "pointer";
                drumcell.onclick = ((id) => {
                    return () => {
                        if (this._playing) {
                            if (this._rulerPlaying === id) {
                                drumcell.innerHTML =
                                    '<img src="header-icons/play-button.svg" title="' +
                                    _("Play") +
                                    '" alt="' +
                                    _("Play") +
                                    '" height="' +
                                    iconSize +
                                    '" width="' +
                                    iconSize +
                                    '" vertical-align="middle">';
                                this._playing = false;
                                this._playingOne = false;
                                this._playingAll = false;
                                this._rulerPlaying = -1;
                                this._startingTime = null;
                                this._elapsedTimes[id] = 0;
                                this._offsets[id] = 0;
                                setTimeout(this._calculateZebraStripes(id), 1000);
                            }
                        } else if (this._playingOne === false) {
                            this._rulerSelected = id;
                            logo.turtleDelay = 0;
                            this._playing = true;
                            this._playingOne = true;
                            this._playingAll = false;
                            this._cellCounter = 0;
                            this._startingTime = null;
                            this._rulerPlaying = id;
                            drumcell.innerHTML =
                                '<img src="header-icons/pause-button.svg" title="' +
                                _("Pause") +
                                '" alt="' +
                                _("Pause") +
                                '" height="' +
                                iconSize +
                                '" width="' +
                                iconSize +
                                '" vertical-align="middle">';
                            this._elapsedTimes[id] = 0;
                            this._offsets[id] = 0;
                            this._playOne();
                        }
                    };
                })(i);
            }

            const rulerCell = rhythmRulerTableRow.insertCell();
            // Create individual rulers as tables.
            rulerCell.innerHTML = '<table id="rulerCellTable' + i + '"></table>';

            const rulerCellTable = docById("rulerCellTable" + i);
            rulerCellTable.style.textAlign = "center";
            rulerCellTable.style.border = "0px";
            rulerCellTable.style.borderCollapse = "collapse";
            rulerCellTable.cellSpacing = "0px";
            rulerCellTable.cellPadding = "0px";
            const rulerRow = rulerCellTable.insertRow();
            this._rulers[i] = rulerRow;
            rulerRow.setAttribute("data-row", i);

            for (let j = 0; j < this.Rulers[i][0].length; j++) {
                const noteValue = this.Rulers[i][0][j];
                const rulerSubCell = rulerRow.insertCell(-1);
                rulerSubCell.innerHTML = calcNoteValueToDisplay(noteValue, 1);
                rulerSubCell.style.height = RhythmRuler.RULERHEIGHT + "px";
                rulerSubCell.style.minHeight = rulerSubCell.style.height;
                rulerSubCell.style.maxHeight = rulerSubCell.style.height;
                rulerSubCell.style.width = this._noteWidth(noteValue) + "px";
                rulerSubCell.style.minWidth = rulerSubCell.style.width;
                rulerSubCell.style.border = "0px";
                rulerSubCell.border = "0px";
                rulerSubCell.padding = "0px";
                rulerSubCell.style.padding = "0px";
                rulerSubCell.style.lineHeight = 60 + " % ";
                if (i % 2 === 0) {
                    if (j % 2 === 0) {
                        rulerSubCell.style.backgroundColor = platformColor.selectorBackground;
                    } else {
                        rulerSubCell.style.backgroundColor = platformColor.selectorSelected;
                    }
                } else {
                    if (j % 2 === 0) {
                        rulerSubCell.style.backgroundColor = platformColor.selectorSelected;
                    } else {
                        rulerSubCell.style.backgroundColor = platformColor.selectorBackground;
                    }
                }

                this.__addCellEventHandlers(rulerSubCell, this._noteWidth(noteValue), noteValue);
            }

            // Match the play button height to the ruler height.
            rhythmRulerTableRow.cells[0].style.width = RhythmRuler.BUTTONSIZE + "px";
            rhythmRulerTableRow.cells[0].style.minWidth = RhythmRuler.BUTTONSIZE + "px";
            rhythmRulerTableRow.cells[0].style.maxWidth = RhythmRuler.BUTTONSIZE + "px";
            rhythmRulerTableRow.cells[0].style.height = rulerRow.offsetHeight + "px";
            rhythmRulerTableRow.cells[0].style.minHeight = rulerRow.offsetHeight + "px";
            rhythmRulerTableRow.cells[0].style.maxHeight = rulerRow.offsetHeight + "px";
            rhythmRulerTableRow.cells[0].style.verticalAlign = "middle";
        }

        // Restore dissect history.
        let cell;
        for (let drum = 0; drum < this.Drums.length; drum++) {
            if (drum === null) {
                continue;
            }

            for (let i = 0; i < this._dissectHistory.length; i++) {
                if (this._dissectHistory[i][1] !== this.Drums[drum]) {
                    continue;
                }

                const rhythmRulerTableRow = this._rulers[drum];
                for (let j = 0; j < this._dissectHistory[i][0].length; j++) {
                    if (this._dissectHistory[i][0][j] == undefined) {
                        continue;
                    }

                    this._rulerSelected = drum;

                    if (typeof this._dissectHistory[i][0][j] === "number") {
                        cell = rhythmRulerTableRow.cells[this._dissectHistory[i][0][j]];
                        this.__toggleRestState(cell, false);
                    } else if (typeof this._dissectHistory[i][0][j][0] === "number") {
                        if (typeof this._dissectHistory[i][0][j][1] === "number") {
                            // dissect is [cell, num]
                            cell = rhythmRulerTableRow.cells[this._dissectHistory[i][0][j][0]];
                            if (cell != undefined) {
                                this.__dissectByNumber(
                                    cell,
                                    this._dissectHistory[i][0][j][1],
                                    false
                                );
                            } else {
                                // console.warn(
                                //     "Could not find cell to divide. Did the order of the rhythm blocks change?"
                                // );
                            }
                        } else {
                            // divide is [cell, [values]]
                            cell = rhythmRulerTableRow.cells[this._dissectHistory[i][0][j][0]];
                            if (cell != undefined) {
                                this.__divideFromList(
                                    cell,
                                    this._dissectHistory[i][0][j][1],
                                    false
                                );
                            }
                        }
                    } else {
                        // tie is [[cell, value], [cell, value]...]
                        const history = this._dissectHistory[i][0][j];
                        this._mouseDownCell = rhythmRulerTableRow.cells[history[0][0]];
                        this._mouseUpCell = rhythmRulerTableRow.cells[last(history)[0]];
                        if (this._mouseUpCell != undefined) {
                            this.__tie(false);
                        }

                        this._mouseDownCell = null;
                        this._mouseUpCell = null;
                    }
                }
            }
        }

        logo.textMsg(_("Click on the ruler to divide it."));
        // this._piemenuRuler(this._rulerSelected);
    }

    /**
     * @private
     * @param {number} noteValue
     * @returns {void}
     */
    _noteWidth(noteValue) {
        const ans = Math.floor(
            EIGHTHNOTEWIDTH *
                (8 / Math.abs(noteValue)) *
                (this.widgetWindow.isMaximized() ? this._fullscreenScaleFactor : 3)
        );
        return ans;
    }

    _scale() {
        if (this.widgetWindow.isMaximized()) {
            const width = this.widgetWindow.getWidgetBody().getBoundingClientRect().width;
            this._fullscreenScaleFactor = Math.floor(width / (EIGHTHNOTEWIDTH * 8));
        }
        this._rulers.forEach((ruler) => {
            if (this.widgetWindow.isMaximized()) {
                Array.prototype.forEach.call(ruler.children, (child) => {
                    child.style.width =
                        Number(child.style.width.slice(0, child.style.width.indexOf("px"))) *
                            (this._fullscreenScaleFactor / 3) +
                        "px";
                    child.style.minWidth = child.style.width;
                });
            } else {
                Array.prototype.forEach.call(ruler.children, (child) => {
                    child.style.width =
                        Math.floor(
                            Number(child.style.width.slice(0, child.style.width.indexOf("px"))) /
                                Math.floor(this._fullscreenScaleFactor / 3)
                        ) + "px";
                    child.style.minWidth = child.style.width;
                });
            }
        });
    }

    /**
     * @private
     * @param {number} rulerno
     * @returns {void}
     */
    _calculateZebraStripes(rulerno) {
        const ruler = this._rulers[rulerno];
        let evenColor;
        if (this._rulerSelected % 2 === 0) {
            evenColor = platformColor.selectorBackground;
        } else {
            evenColor = platformColor.selectorSelected;
        }

        for (let i = 0; i < ruler.cells.length; i++) {
            const newCell = ruler.cells[i];
            newCell.style.border = "2px solid lightgrey";
            newCell.style.borderRadius = "10px";
            if (evenColor === platformColor.selectorBackground) {
                if (i % 2 === 0) {
                    newCell.style.backgroundColor = platformColor.selectorBackground;
                } else {
                    newCell.style.backgroundColor = platformColor.selectorSelected;
                }
            }

            if (evenColor === platformColor.selectorSelected) {
                if (i % 2 === 0) {
                    newCell.style.backgroundColor = platformColor.selectorSelected;
                } else {
                    newCell.style.backgroundColor = platformColor.selectorBackground;
                }
            }
        }
    }

    /**
     * @private
     * @param {string} ruler
     * @param {Event} event - The triggering event.
     * @returns {void}
     */
    _dissectRuler(event, ruler) {
        const cell = event.target;
        if (cell === null) {
            return;
        }

        if (this._tapMode && this._tapTimes.length > 0) {
            const d = new Date();
            this._tapTimes.push(d.getTime());
            return;
        }

        const cellParent = cell.parentNode;
        if (cellParent === null) {
            return;
        }

        this._rulerSelected = ruler;
        if (this._rulerSelected == undefined) {
            return;
        }

        if (this._playing) {
            // console.warn("You cannot dissect while widget is playing.");
            return;
        } else if (this._tapMode) {
            // Tap a rhythm by clicking in a cell.
            if (this._tapCell === null) {
                const noteValues = this.Rulers[this._rulerSelected][0];
                this._tapCell = event.target;
                if (noteValues[this._tapCell.cellIndex] < 0) {
                    // Don't allow tapping in rests.
                    this._tapCell = null;
                    this._tapMode = false;
                    this._tapTimes = [];
                    this._tapEndTime = null;
                    this._tapButton.innerHTML =
                        '<img src="header-icons/tap-button.svg" title="' +
                        _("tap a rhythm") +
                        '" alt="' +
                        _("tap a rhythm") +
                        '" height="' +
                        RhythmRuler.ICONSIZE +
                        '" width="' +
                        RhythmRuler.ICONSIZE +
                        '" vertical-align="middle">';
                    return;
                }

                this._tapTimes = [];

                // Play a count off before starting tapping.
                const interval = this._bpmFactor / Math.abs(noteValues[this._tapCell.cellIndex]);

                let drum;
                if (this.Drums[this._rulerSelected] === null) {
                    drum = "snare drum";
                } else {
                    const drumBlockNo =
                        logo.blocks.blockList[this.Drums[this._rulerSelected]].connections[1];
                    drum = logo.blocks.blockList[drumBlockNo].value;
                }

                // FIXME: Should be based on meter
                for (let i = 0; i < 4; i++) {
                    setTimeout(() => {
                        logo.synth.trigger(0, "C4", Singer.defaultBPMFactor / 16, drum, null, null);
                    }, (interval * i) / 4);
                }

                setTimeout(() => {
                    this.__startTapping(interval, event);
                }, interval);
            }
        } else {
            let inputNum = this._dissectNumber.value;
            if (inputNum === "" || isNaN(inputNum)) {
                inputNum = 2;
            } else {
                inputNum = Math.abs(Math.floor(inputNum));
            }

            this._dissectNumber.value = inputNum;

            this._rulerSelected = cell.parentNode.getAttribute("data-row");
            this.__dissectByNumber(cell, inputNum, true);
        }

        // this._piemenuRuler(this._rulerSelected);

        //Save dissect history everytime user dissects ruler
        this.saveDissectHistory();
    }

    /**
     * @private
     * @param {number} noteValues
     * @param {Event} event - The triggering event.
     * @param {number} interval
     * @returns {void}
     */
    __startTapping(interval, event) {
        const d = new Date();
        this._tapTimes = [d.getTime()];
        this._tapEndTime = this._tapTimes[0] + interval;

        // Set a timeout to end tapping
        setTimeout(() => {
            this.__endTapping(event);
        }, interval);

        // Display a progress bar.
        const __move = (tick, stepSize) => {
            let width = 1;

            const id = setInterval(() => {
                if (width >= 100) {
                    clearInterval(id);
                } else {
                    width += stepSize;
                    this._progressBar.style.width = width + "%";
                }
            }, tick);
        };

        this._tapCell.innerHTML = "<div class='progressBar'></div>";
        this._progressBar = this._tapCell.querySelector(".progressBar");
        // Progress once per 8th note.
        __move(interval / 8, 100 / 8);
    }

    /**
     * @private
     * @param {Event} event - The triggering event.
     * @returns {void}
     */
    __endTapping(event) {
        const cell = event.target;
        if (cell.parentNode === null) {
            // console.debug("Null parent node in endTapping");
            return;
        }

        this._rulerSelected = cell.parentNode.getAttribute("data-row");
        if (this._progressBar) this._progressBar.remove();
        this._tapCell.innerHTML = "";

        const d = new Date();
        this._tapTimes.push(d.getTime());

        this._tapMode = false;
        if (typeof this._rulerSelected === "string" || typeof this._rulerSelected === "number") {
            const noteValues = this.Rulers[this._rulerSelected][0];

            if (last(this._tapTimes) > this._tapEndTime) {
                this._tapTimes[this._tapTimes.length - 1] = this._tapEndTime;
            }

            // convert times into cells here.
            let inputNum = this._dissectNumber.value;
            if (inputNum === "" || isNaN(inputNum)) {
                inputNum = 2;
            } else {
                inputNum = Math.abs(Math.floor(inputNum));
            }

            // Minimum beat is tied to the input number
            let minimumBeat;
            switch (inputNum) {
                case 2:
                    minimumBeat = 16;
                    break;
                case 3:
                    minimumBeat = 27;
                    break;
                case 4:
                    minimumBeat = 32;
                    break;
                case 5:
                    minimumBeat = 25;
                    break;
                case 6:
                    minimumBeat = 36;
                    break;
                case 7:
                    minimumBeat = 14;
                    break;
                case 8:
                    minimumBeat = 64;
                    break;
                default:
                    minimumBeat = 16;
                    break;
            }

            const newNoteValues = [];
            let sum = 0;
            let obj;
            // let interval =
            //     this._bpmFactor / Math.abs(noteValues[this._tapCell.cellIndex]);
            for (let i = 1; i < this._tapTimes.length; i++) {
                const dtime = this._tapTimes[i] - this._tapTimes[i - 1];
                if (i < this._tapTimes.length - 1) {
                    obj = nearestBeat((100 * dtime) / this._bpmFactor, minimumBeat);
                    if (obj[0] === 0) {
                        obj[0] = 1;
                        obj[1] = obj[1] / 2;
                    }

                    if (sum + obj[0] / obj[1] < 1) {
                        sum += obj[0] / obj[1];
                        newNoteValues.push(obj[1] / obj[0]);
                    }
                } else {
                    // Since the fractional value is noisy,
                    // ensure that the final beat make the
                    // total add up to the proper note value.
                    obj = rationalToFraction(1 / noteValues[this._tapCell.cellIndex] - sum);
                    newNoteValues.push(obj[1] / obj[0]);
                }
            }

            this.__divideFromList(this._tapCell, newNoteValues, true);
        }

        this._tapTimes = [];
        this._tapCell = null;
        this._tapEndTime = null;
        // let iconSize = RhythmRuler.ICONSIZE;
        this._tapButton.innerHTML =
            '<img src="header-icons/tap-button.svg" title="' +
            _("tap a rhythm") +
            '" alt="' +
            _("tap a rhythm") +
            '" height="' +
            RhythmRuler.ICONSIZE +
            '" width="' +
            RhythmRuler.ICONSIZE +
            '" vertical-align="middle">';
    }

    /**
     * @private
     * @param {HTMLElement} cell  - The HTML element target
     * @param {number} cellWidth
     * @param {number} noteValue
     * @returns {void}
     */
    __addCellEventHandlers(cell, cellWidth, noteValue) {
        const __mouseOverHandler = (event) => {
            const cell = event.target;
            if (cell === null || cell.parentNode === null) {
                return;
            }

            this._rulerSelected = cell.parentNode.getAttribute("data-row");
            const noteValues = this.Rulers[this._rulerSelected][0];
            const noteValue = noteValues[cell.cellIndex];
            let obj;
            if (noteValue < 0) {
                obj = rationalToFraction(Math.abs(Math.abs(-1 / noteValue)));
                cell.innerHTML = calcNoteValueToDisplay(obj[1], obj[0]) + " " + _("silence");
            } else {
                obj = rationalToFraction(Math.abs(Math.abs(1 / noteValue)));
                cell.innerHTML = calcNoteValueToDisplay(obj[1], obj[0]);
            }
        };

        const __mouseOutHandler = (event) => {
            const cell = event.target;
            cell.innerHTML = "";
        };

        const __mouseDownHandler = (event) => {
            const cell = event.target;
            this._mouseDownCell = cell;

            const d = new Date();
            this._longPressStartTime = d.getTime();
            this._inLongPress = false;

            this._longPressBeep = setTimeout(() => {
                // Removing audio feedback on long press since it
                // occasionally confuses tone.js during rapid clicking
                // in the widget.

                // logo.synth.trigger(0, 'C4', 1 / 32, 'chime', null, null);

                const cell = this._mouseDownCell;
                if (cell !== null && cell.parentNode !== null) {
                    this._rulerSelected = cell.parentNode.getAttribute("data-row");
                    // const noteValues = this.Rulers[this._rulerSelected][0];
                    cell.style.backgroundColor = platformColor.selectorBackground;
                }
            }, 1500);
        };

        const __mouseUpHandler = (event) => {
            clearTimeout(this._longPressBeep);
            const cell = event.target;
            this._mouseUpCell = cell;
            if (this._mouseDownCell !== this._mouseUpCell) {
                this._tieRuler(event, cell.parentNode.getAttribute("data-row"));
            } else if (this._longPressStartTime !== null && !this._tapMode) {
                const d = new Date();
                const elapseTime = d.getTime() - this._longPressStartTime;
                if (elapseTime > 1500) {
                    this._inLongPress = true;
                    this.__toggleRestState(this, true);
                }
            }

            this._mouseDownCell = null;
            this._mouseUpCell = null;
            this._longPressStartTime = null;
        };

        const __clickHandler = (event) => {
            if (event == undefined) return;
            if (!this.__getLongPressStatus()) {
                const cell = event.target;
                if (cell !== null && cell.parentNode !== null) {
                    this._dissectRuler(event, cell.parentNode.getAttribute("data-row"));
                } else {
                    // console.error("Rhythm Ruler: null cell found on click");
                }
            }

            this._inLongPress = false;
        };

        let obj;
        if (cellWidth >= 18 && noteValue > 0) {
            obj = rationalToFraction(Math.abs(1 / noteValue));
            cell.innerHTML = calcNoteValueToDisplay(obj[1], obj[0]);
        } else {
            cell.innerHTML = "";

            cell.removeEventListener("mouseover", __mouseOverHandler);
            cell.addEventListener("mouseover", __mouseOverHandler);

            cell.removeEventListener("mouseout", __mouseOutHandler);
            cell.addEventListener("mouseout", __mouseOutHandler);
        }

        cell.removeEventListener("mousedown", __mouseDownHandler);
        cell.addEventListener("mousedown", __mouseDownHandler);

        cell.removeEventListener("mouseup", __mouseUpHandler);
        cell.addEventListener("mouseup", __mouseUpHandler);

        cell.removeEventListener("click", __clickHandler);
        cell.addEventListener("click", __clickHandler);
    }

    /**
     * @private
     * @returns {void}
     */
    __getLongPressStatus() {
        return this._inLongPress;
    }

    /**
     * @private
     * @param {number} cellWidth
     * @param {boolean} addToUndoList
     * @returns {void}
     */
    __toggleRestState(cell, addToUndoList) {
        if (cell !== null && cell.parentNode !== null) {
            this._rulerSelected = cell.parentNode.getAttribute("data-row");
            const noteValues = this.Rulers[this._rulerSelected][0];
            const noteValue = noteValues[cell.cellIndex];

            const __mouseOverHandler = (event) => {
                const cell = event.target;
                if (cell === null) {
                    return;
                }

                let obj;

                this._rulerSelected = cell.parentNode.getAttribute("data-row");
                const noteValues = this.Rulers[this._rulerSelected][0];
                const noteValue = noteValues[cell.cellIndex];
                if (noteValue < 0) {
                    obj = rationalToFraction(Math.abs(Math.abs(-1 / noteValue)));
                    cell.innerHTML = calcNoteValueToDisplay(obj[1], obj[0]) + " " + _("silence");
                } else {
                    obj = rationalToFraction(Math.abs(Math.abs(1 / noteValue)));
                    cell.innerHTML = calcNoteValueToDisplay(obj[1], obj[0]);
                }
            };

            const __mouseOutHandler = (event) => {
                const cell = event.target;
                cell.innerHTML = "";
            };

            let obj;
            if (noteValue < 0) {
                obj = rationalToFraction(Math.abs(1 / noteValue));
                cell.innerHTML = calcNoteValueToDisplay(obj[1], obj[0]);
                cell.removeEventListener("mouseover", __mouseOverHandler);
                cell.removeEventListener("mouseout", __mouseOutHandler);
            } else {
                cell.innerHTML = "";

                cell.removeEventListener("mouseover", __mouseOverHandler);
                cell.addEventListener("mouseover", __mouseOverHandler);

                cell.removeEventListener("mouseout", __mouseOutHandler);
                cell.addEventListener("mouseout", __mouseOutHandler);
            }

            noteValues[cell.cellIndex] = -noteValue;

            this._calculateZebraStripes(this._rulerSelected);

            const divisionHistory = this.Rulers[this._rulerSelected][1];
            if (addToUndoList) {
                this._undoList.push(["rest", this._rulerSelected]);
            }

            divisionHistory.push(cell.cellIndex);
        }

        // this._piemenuRuler(this._rulerSelected);
    }

    /**
     * @private
     * @param {HTMLElement} cell  - The HTML element target
     * @param {number} newNoteValues
     * @param {boolean} addToUndoList
     * @returns {void}
     */
    __divideFromList(cell, newNoteValues, addToUndoList) {
        if (typeof cell !== "object") {
            return;
        }

        if (typeof newNoteValues !== "object") {
            return;
        }

        const ruler = this._rulers[this._rulerSelected];
        const newCellIndex = cell.cellIndex;

        if (typeof this._rulerSelected === "string" || typeof this._rulerSelected === "number") {
            const noteValues = this.Rulers[this._rulerSelected][0];

            const divisionHistory = this.Rulers[this._rulerSelected][1];
            if (addToUndoList) {
                this._undoList.push(["tap", this._rulerSelected]);
            }

            divisionHistory.push([newCellIndex, newNoteValues]);

            ruler.deleteCell(newCellIndex);

            // let noteValue = noteValues[newCellIndex];
            // let tempwidth = this._noteWidth(newNoteValue);
            noteValues.splice(newCellIndex, 1);

            for (let i = 0; i < newNoteValues.length; i++) {
                const newCell = ruler.insertCell(newCellIndex + i);
                const newNoteValue = newNoteValues[i];
                const newCellWidth = parseFloat(this._noteWidth(newNoteValue));
                noteValues.splice(newCellIndex + i, 0, newNoteValue);

                newCell.style.width = newCellWidth + "px";
                newCell.style.minWidth = newCell.style.width;
                newCell.style.height = RhythmRuler.RULERHEIGHT + "px";
                newCell.style.minHeight = newCell.style.height;
                newCell.style.maxHeight = newCell.style.height;

                this.__addCellEventHandlers(newCell, newCellWidth, newNoteValue);
            }

            this._calculateZebraStripes(this._rulerSelected);
        }

        // this._piemenuRuler(this._rulerSelected);
    }

    /**
     * @private
     * @param {HTMLElement} cell  - The HTML element target
     * @param {number} inputNum
     * @param {boolean} addToUndoList
     * @returns {void}
     */
    __dissectByNumber(cell, inputNum, addToUndoList) {
        if (typeof cell !== "object") {
            return;
        }

        if (typeof inputNum !== "number") {
            return;
        }

        const ruler = this._rulers[this._rulerSelected];
        const newCellIndex = cell.cellIndex;

        if (typeof this._rulerSelected === "string" || typeof this._rulerSelected === "number") {
            const noteValues = this.Rulers[this._rulerSelected][0];

            const noteValue = noteValues[newCellIndex];
            if (inputNum * noteValue > 256) {
                logo.errorMsg(_("Maximum value of 256 has been exceeded."));
                return;
            } else {
                logo.hideMsgs();
            }

            const divisionHistory = this.Rulers[this._rulerSelected][1];
            if (addToUndoList) {
                this._undoList.push(["dissect", this._rulerSelected]);
            }

            divisionHistory.push([newCellIndex, inputNum]);

            ruler.deleteCell(newCellIndex);

            let newNoteValue = 0;

            newNoteValue = inputNum * noteValue;

            const tempwidth = this._noteWidth(newNoteValue);
            const difference =
                parseFloat(this._noteWidth(noteValue)) -
                parseFloat(inputNum) * parseFloat(tempwidth);
            const newCellWidth =
                parseFloat(this._noteWidth(newNoteValue)) + parseFloat(difference) / inputNum;
            noteValues.splice(newCellIndex, 1);

            for (let i = 0; i < inputNum; i++) {
                const newCell = ruler.insertCell(newCellIndex + i);
                noteValues.splice(newCellIndex + i, 0, newNoteValue);

                newCell.style.width = newCellWidth + "px";
                newCell.style.minWidth = newCell.style.width;
                newCell.style.height = RhythmRuler.RULERHEIGHT + "px";
                newCell.style.minHeight = newCell.style.height;
                newCell.style.maxHeight = newCell.style.height;

                this.__addCellEventHandlers(newCell, newCellWidth, newNoteValue);
            }

            this._calculateZebraStripes(this._rulerSelected);
        }

        // this._piemenuRuler(this._rulerSelected);
    }

    /**
     * @private
     * @param {Event} event - The triggering event.
     * @param {string} ruler
     * @returns {void}
     */
    _tieRuler(event, ruler) {
        if (this._playing) {
            // console.warn("You cannot tie while widget is playing.");
            return;
        } else if (this._tapMode) {
            // If we are tapping, then treat a tie as a tap.
            this._dissectRuler(event, ruler);
            return;
        }

        // Does this work if there are more than 10 rulers?
        const cell = event.target;
        if (cell !== null && cell.parentNode !== null) {
            this._rulerSelected = cell.parentNode.getAttribute("data-row");
            this.__tie(true);
        }

        // this._piemenuRuler(this._rulerSelected);
    }

    /**
     * @private
     * @param {boolean} addToUndoList
     * @returns {void}
     */
    __tie(addToUndoList) {
        const ruler = this._rulers[this._rulerSelected];

        if (this._mouseDownCell === null || this._mouseUpCell === null) {
            return;
        }

        if (this._mouseDownCell === this._mouseUpCell) {
            return;
        }

        if (typeof this._rulerSelected === "string" || typeof this._rulerSelected === "number") {
            let noteValues = this.Rulers[this._rulerSelected][0];

            let downCellIndex = this._mouseDownCell.cellIndex;
            let upCellIndex = this._mouseUpCell.cellIndex;

            if (downCellIndex === -1 || upCellIndex === -1) {
                return;
            }

            if (downCellIndex > upCellIndex) {
                let tmp = downCellIndex;
                downCellIndex = upCellIndex;
                upCellIndex = tmp;
                tmp = this._mouseDdownCell;
                this._mouseDownCell = this._mouseUpCell;
                this._mouseUpCell = tmp;
            }

            noteValues = this.Rulers[this._rulerSelected][0];

            const divisionHistory = this.Rulers[this._rulerSelected][1];
            if (addToUndoList) {
                this._undoList.push(["tie", this._rulerSelected]);
            }

            const history = [];
            for (let i = downCellIndex; i < upCellIndex + 1; i++) {
                history.push([i, noteValues[i]]);
            }

            divisionHistory.push(history);

            const oldNoteValue = noteValues[downCellIndex];
            let noteValue = Math.abs(1 / oldNoteValue);

            // Delete all the cells between down and up except the down
            // cell, which we will expand.
            for (let i = upCellIndex; i > downCellIndex; i--) {
                noteValue += Math.abs(1 / noteValues[i]);
                ruler.deleteCell(i);
                this.Rulers[this._rulerSelected][0].splice(i, 1);
            }

            const newCellWidth = this._noteWidth(1 / noteValue);
            // Use noteValue of downCell for REST status.
            if (oldNoteValue < 0) {
                noteValues[downCellIndex] = -1 / noteValue;
            } else {
                noteValues[downCellIndex] = 1 / noteValue;
            }

            this._mouseDownCell.style.width = newCellWidth + "px";
            this._mouseDownCell.style.minWidth = this._mouseDownCell.style.width;
            this._mouseDownCell.style.height = RhythmRuler.RULERHEIGHT + "px";
            this._mouseDownCell.style.minHeight = this._mouseDownCell.style.height;
            this._mouseDownCell.style.maxHeight = this._mouseDownCell.style.height;

            this.__addCellEventHandlers(
                this._mouseDownCell,
                newCellWidth,
                noteValues[downCellIndex]
            );

            this._calculateZebraStripes(this._rulerSelected);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _undo() {
        // FIXME: Add undo for REST
        logo.synth.stop();
        this._startingTime = null;
        this._playing = false;
        this._playingAll = false;
        this._playingOne = false;
        this._rulerPlaying = -1;
        this._startingTime = null;

        if (this._undoList.length === 0) {
            return;
        }

        const obj = this._undoList.pop();
        const lastRuler = obj[1];
        const divisionHistory = this.Rulers[lastRuler][1];
        if (divisionHistory.length === 0) {
            return;
        }

        const ruler = this._rulers[lastRuler];
        const noteValues = this.Rulers[lastRuler][0];

        if (obj[0] === "dissect") {
            const inputNum = divisionHistory[divisionHistory.length - 1][1];
            const newCellIndex = divisionHistory[divisionHistory.length - 1][0];
            const cellWidth = ruler.cells[newCellIndex].style.width;
            const newCellWidth = parseFloat(cellWidth) * inputNum;
            const oldCellNoteValue = noteValues[newCellIndex];
            const newNoteValue = oldCellNoteValue / inputNum;

            const newCell = ruler.insertCell(newCellIndex);
            newCell.style.width = this._noteWidth(newNoteValue) + "px";
            newCell.style.minWidth = newCell.style.width;
            newCell.style.height = RhythmRuler.RULERHEIGHT + "px";
            newCell.style.minHeight = newCell.style.height;
            newCell.style.maxHeight = newCell.style.height;

            newCell.style.backgroundColor = platformColor.selectorBackground;
            newCell.innerHTML = calcNoteValueToDisplay(oldCellNoteValue / inputNum, 1);

            noteValues[newCellIndex] = oldCellNoteValue / inputNum;
            noteValues.splice(newCellIndex + 1, inputNum - 1);

            this.__addCellEventHandlers(newCell, newCellWidth, newNoteValue);

            for (let i = 0; i < inputNum; i++) {
                ruler.deleteCell(newCellIndex + 1);
            }
        } else if (obj[0] === "tap") {
            const newCellIndex = last(divisionHistory)[0];
            const oldNoteValues = last(divisionHistory)[1];

            // Calculate the new note value based on the sum of the
            // oldnoteValues.
            let sum = 0;
            for (let i = 0; i < oldNoteValues.length; i++) {
                sum += 1 / oldNoteValues[i];
            }

            const newNoteValue = 1 / sum;
            const newCellWidth = this._noteWidth(newNoteValue);

            const newCell = ruler.insertCell(newCellIndex);
            newCell.style.width = newCellWidth + "px";
            newCell.style.minWidth = newCell.style.width;
            newCell.style.height = RhythmRuler.RULERHEIGHT + "px";
            newCell.style.minHeight = newCell.style.height;
            newCell.style.maxHeight = newCell.style.height;

            newCell.style.backgroundColor = platformColor.selectorBackground;

            const obj = rationalToFraction(newNoteValue);
            newCell.innerHTML = calcNoteValueToDisplay(obj[1], obj[0]);

            noteValues[newCellIndex] = newNoteValue;
            noteValues.splice(newCellIndex + 1, oldNoteValues.length - 1);

            this.__addCellEventHandlers(newCell, newCellWidth, newNoteValue);

            for (let i = 0; i < oldNoteValues.length; i++) {
                ruler.deleteCell(newCellIndex + 1);
            }
        } else if (obj[0] === "tie") {
            const history = last(divisionHistory);
            // The old cell is the same as the first entry in the
            // history. Dissect the old cell into history.length
            // parts and restore their size and note values.
            if (history.length > 0) {
                const oldCell = ruler.cells[history[0][0]];
                const oldCellWidth = this._noteWidth(history[0][1]);
                oldCell.style.width = oldCellWidth + "px";
                oldCell.style.minWidth = oldCell.style.width;
                oldCell.style.height = RhythmRuler.RULERHEIGHT + "px";
                oldCell.style.minHeight = oldCell.style.height;
                oldCell.style.maxHeight = oldCell.style.height;

                noteValues[history[0][0]] = history[0][1];
                this.__addCellEventHandlers(oldCell, oldCellWidth, history[0][1]);

                for (let i = 1; i < history.length; i++) {
                    const newCell = ruler.insertCell(history[0][0] + i);
                    const newCellWidth = this._noteWidth(history[i][1]);
                    newCell.style.width = newCellWidth + "px";
                    newCell.style.minWidth = newCell.style.width;
                    newCell.style.height = RhythmRuler.RULERHEIGHT + "px";
                    newCell.style.minHeight = newCell.style.height;
                    newCell.style.maxHeight = newCell.style.height;

                    noteValues.splice(history[0][0] + i, 0, history[i][1]);
                    newCell.innerHTML = calcNoteValueToDisplay(history[i][1], 1);

                    this.__addCellEventHandlers(newCell, newCellWidth, history[i][1]);
                }

                this.Rulers[lastRuler][0] = noteValues;
            } else {
                // console.warn("empty history encountered... skipping undo");
            }
        } else if (obj[0] === "rest") {
            const newCellIndex = last(divisionHistory);
            const cell = ruler.cells[newCellIndex];
            this.__toggleRestState(cell, false);
            divisionHistory.pop();
        }

        divisionHistory.pop();
        this._calculateZebraStripes(lastRuler);

        // this._piemenuRuler(this._rulerSelected);
    }

    /**
     * @private
     * @returns {void}
     */
    _tap() {
        this._tapMode = true;
        const iconSize = RhythmRuler.ICONSIZE;
        this._tapButton.innerHTML =
            '<img src="header-icons/tap-active-button.svg" title="' +
            _("tap a rhythm") +
            '" alt="' +
            _("tap a rhythm") +
            '" height="' +
            iconSize +
            '" width="' +
            iconSize +
            '" vertical-align="middle">';
    }

    /**
     * @private
     * @returns {void}
     */
    _clear() {
        logo.synth.stop();
        logo.resetSynth(0);
        this._playing = false;
        this._playingAll = false;
        this._playingOne = false;
        this._rulerPlaying = -1;
        this._startingTime = null;
        this._playAllCell.innerHTML =
            '<img src="header-icons/play-button.svg" title="' +
            _("Play all") +
            '" alt="' +
            _("Play all") +
            '" height="' +
            RhythmRuler.ICONSIZE +
            '" width="' +
            RhythmRuler.ICONSIZE +
            '" vertical-align="middle">';
        for (let r = 0; r < this.Rulers.length; r++) {
            this._rulerSelected = r;
            while (this.Rulers[r][1].length > 0) {
                this._undo();
            }
        }

        // this._piemenuRuler(this._rulerSelected);
    }

    /**
     * @private
     * @returns {void}
     */
    __pause() {
        this._playAllCell.innerHTML =
            '<img src="header-icons/play-button.svg" title="' +
            _("Play all") +
            '" alt="' +
            _("Play all") +
            '" height="' +
            RhythmRuler.ICONSIZE +
            '" width="' +
            RhythmRuler.ICONSIZE +
            '" vertical-align="middle">';
        this._playing = false;
        this._playingAll = false;
        this._playingOne = false;
        this._rulerPlaying = -1;
        this._startingTime = null;
        for (let i = 0; i < this.Rulers.length; i++) {
            this._calculateZebraStripes(i);
        }
    }

    /**
     * @public
     * @returns {void}
     */
    playAll() {
        // External call from run button.
        if (this._playing) {
            if (this._playingAll) {
                this.__pause();
                // Wait for pause to complete before restarting.
                this._playingAll = true;

                setTimeout(() => {
                    this.__resume();
                }, 1000);
            }
        } else if (!this._playingAll) {
            this.__resume();
        }
    }

    /**
     * @private
     * @returns {void}
     */
    __resume() {
        this._playAllCell.innerHTML =
            '<img src="header-icons/pause-button.svg" title="' +
            _("Pause") +
            '" alt="' +
            _("Pause") +
            '" height="' +
            RhythmRuler.ICONSIZE +
            '" width="' +
            RhythmRuler.ICONSIZE +
            '" vertical-align="middle">';
        logo.turtleDelay = 0;
        this._playingAll = true;
        this._playing = true;
        this._playingOne = false;
        this._cellCounter = 0;
        this._rulerPlaying = -1;
        for (let i = 0; i < this.Rulers.length; i++) {
            this._elapsedTimes[i] = 0;
            this._offsets[i] = 0;
        }

        this._playAll();
    }

    /**
     * @private
     * @returns {void}
     */
    _playAll() {
        logo.synth.stop();
        logo.resetSynth(0);
        if (this._startingTime === null) {
            const d = new Date();
            this._startingTime = d.getTime();
            for (let i = 0; i < this.Rulers.length; i++) {
                this._offsets[i] = 0;
                this._elapsedTimes[i] = 0;
            }
        }

        for (let i = 0; i < this.Rulers.length; i++) {
            this.__loop(0, i, 0);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _playOne() {
        logo.synth.stop();
        logo.resetSynth(0);
        if (this._startingTime === null) {
            const d = new Date();
            this._startingTime = d.getTime();
            this._elapsedTimes[this._rulerSelected] = 0;
            this._offsets[this._rulerSelected] = 0;
        }
        // console.debug("this._rulerSelected " + this._rulerSelected);

        this.__loop(0, this._rulerSelected, 0);
    }

    /**
     * @private
     * @param {number} noteTime
     * @param {number} rulerNo
     * @param {number} colIndex
     * @returns {void}
     */
    __loop(noteTime, rulerNo, colIndex) {
        const ruler = this._rulers[rulerNo];
        if (ruler === null) {
            // console.warn("Cannot find ruler " + rulerNo + ". Widget closed?");
            return;
        }

        // Refresh the divisions each time we cycle.
        if (colIndex === 0) {
            this._calculateZebraStripes(rulerNo);
        }

        const cell = ruler.cells[colIndex];
        const noteValues = this.Rulers[rulerNo][0];
        const noteValue = noteValues[colIndex];

        noteTime = Math.abs(1 / noteValue);
        let drum;
        if (this.Drums[rulerNo] === null) {
            drum = "snare drum";
        } else {
            const drumblockno = logo.blocks.blockList[this.Drums[rulerNo]].connections[1];
            drum = logo.blocks.blockList[drumblockno].value;
        }

        let foundDrum = false;
        // Convert i18n drum name to English.
        for (let d = 0; d < DRUMNAMES.length; d++) {
            if (DRUMNAMES[d][0].replace("-", " ") === drum) {
                drum = DRUMNAMES[d][1];
                foundDrum = true;
                break;
            } else if (DRUMNAMES[d][1] === drum) {
                foundDrum = true;
                break;
            }
        }

        let foundVoice = false;
        if (!foundDrum) {
            for (let d = 0; d < VOICENAMES.length; d++) {
                if (VOICENAMES[d][0] === drum) {
                    drum = VOICENAMES[d][1];
                    foundVoice = true;
                    break;
                } else if (VOICENAMES[d][1] === drum) {
                    foundVoice = true;
                    break;
                }
            }
        }

        if (this._playing) {
            // Play the current note.
            if (noteValue > 0) {
                if (foundVoice) {
                    logo.synth.trigger(
                        0,
                        "C4",
                        Singer.defaultBPMFactor / noteValue,
                        drum,
                        null,
                        null,
                        false
                    );
                } else if (foundDrum) {
                    logo.synth.trigger(
                        0,
                        ["C4"],
                        Singer.defaultBPMFactor / noteValue,
                        drum,
                        null,
                        null
                    );
                }
            }

            // And highlight its cell.
            cell.style.backgroundColor = platformColor.rulerHighlight; // selectorBackground;

            // Calculate any offset in playback.
            const d = new Date();
            this._offsets[rulerNo] = d.getTime() - this._startingTime - this._elapsedTimes[rulerNo];
        }

        setTimeout(() => {
            colIndex += 1;
            if (colIndex === noteValues.length) {
                colIndex = 0;
            }

            if (this._playing) {
                this.__loop(noteTime, rulerNo, colIndex);
            }
        }, Singer.defaultBPMFactor * 1000 * noteTime - this._offsets[rulerNo]);

        this._elapsedTimes[rulerNo] += Singer.defaultBPMFactor * 1000 * noteTime;
    }

    /**
     * @deprecated
     * @private
     * @param {number} selectedRuler
     * @returns {void}
     */
    _save(selectedRuler) {
        // Deprecated -- replaced by save tuplets code

        for (const name in logo.blocks.palettes.dict) {
            logo.blocks.palettes.dict[name].hideMenu(true);
        }

        logo.refreshCanvas();

        setTimeout(() => {
            const ruler = this._rulers[selectedRuler];
            const noteValues = this.Rulers[selectedRuler][0];
            // Get the first word of drum's name (ignore the word 'drum' itself)
            // and add 'rhythm'.
            let stack_value;
            if (this.Drums[selectedRuler] === null) {
                stack_value = _("snare drum") + " " + _("rhythm");
            } else {
                stack_value =
                    logo.blocks.blockList[
                        logo.blocks.blockList[this.Drums[selectedRuler]].connections[1]
                    ].value.split(" ")[0] +
                    " " +
                    _("rhythm");
            }
            const delta = selectedRuler * 42;
            const newStack = [
                [0, ["action", { collapsed: true }], 100 + delta, 100 + delta, [null, 1, 2, null]],
                [1, ["text", { value: stack_value }], 0, 0, [0]]
            ];
            let previousBlock = 0;
            let sameNoteValue = 1;
            for (let i = 0; i < ruler.cells.length; i++) {
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    sameNoteValue += 1;
                    continue;
                } else {
                    const idx = newStack.length;
                    const noteValue = noteValues[i];

                    const obj = rationalToFraction(1 / Math.abs(noteValue));

                    newStack.push([
                        idx,
                        "rhythm2",
                        0,
                        0,
                        [previousBlock, idx + 1, idx + 2, idx + 5]
                    ]);
                    newStack.push([idx + 1, ["number", { value: sameNoteValue }], 0, 0, [idx]]);
                    newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);
                    newStack.push([idx + 3, ["number", { value: obj[0] }], 0, 0, [idx + 2]]);
                    newStack.push([idx + 4, ["number", { value: obj[1] }], 0, 0, [idx + 2]]);
                    newStack.push([idx + 5, "vspace", 0, 0, [idx, idx + 6]]);
                    if (i == ruler.cells.length - 1) {
                        newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, null]]);
                    } else {
                        newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, idx + 7]]);
                    }

                    previousBlock = idx + 6;
                    sameNoteValue = 1;
                }
            }

            logo.blocks.loadNewBlocks(newStack);
            if (selectedRuler > this.Rulers.length - 2) {
                return;
            } else {
                this._save(selectedRuler + 1);
            }
        }, 500);
    }

    /**
     * @private
     * @param {number} selectedRuler
     * @returns {void}
     */
    _saveTuplets(selectedRuler) {
        for (const name in logo.blocks.palettes.dict) {
            logo.blocks.palettes.dict[name].hideMenu(true);
        }

        logo.refreshCanvas();

        setTimeout(() => {
            const ruler = this._rulers[selectedRuler];
            const noteValues = this.Rulers[selectedRuler][0];
            let stack_value;
            if (this.Drums[selectedRuler] === null) {
                stack_value = _("rhythm");
            } else {
                stack_value =
                    logo.blocks.blockList[
                        logo.blocks.blockList[this.Drums[selectedRuler]].connections[1]
                    ].value.split(" ")[0] +
                    " " +
                    _("rhythm");
            }
            const delta = selectedRuler * 42;
            const newStack = [
                [0, ["action", { collapsed: true }], 100 + delta, 100 + delta, [null, 1, 2, null]],
                [1, ["text", { value: stack_value }], 0, 0, [0]]
            ];
            let previousBlock = 0;
            let sameNoteValue = 1;
            for (let i = 0; i < ruler.cells.length; i++) {
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    sameNoteValue += 1;
                    continue;
                } else {
                    const idx = newStack.length;
                    const noteValue = noteValues[i];
                    const obj = rationalToFraction(1 / Math.abs(noteValue));
                    const n = obj[1] / sameNoteValue;
                    if (Number.isInteger(n)) {
                        newStack.push([
                            idx,
                            "stuplet",
                            0,
                            0,
                            [previousBlock, idx + 1, idx + 2, idx + 5]
                        ]);
                        newStack.push([idx + 1, ["number", { value: sameNoteValue }], 0, 0, [idx]]);
                        newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);
                        newStack.push([idx + 3, ["number", { value: obj[0] }], 0, 0, [idx + 2]]);
                        newStack.push([idx + 4, ["number", { value: n }], 0, 0, [idx + 2]]);
                        newStack.push([idx + 5, "vspace", 0, 0, [idx, idx + 6]]);
                    } else {
                        newStack.push([
                            idx,
                            "rhythm2",
                            0,
                            0,
                            [previousBlock, idx + 1, idx + 2, idx + 5]
                        ]);
                        newStack.push([idx + 1, ["number", { value: sameNoteValue }], 0, 0, [idx]]);
                        newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);
                        newStack.push([idx + 3, ["number", { value: obj[0] }], 0, 0, [idx + 2]]);
                        newStack.push([idx + 4, ["number", { value: obj[1] }], 0, 0, [idx + 2]]);
                        newStack.push([idx + 5, "vspace", 0, 0, [idx, idx + 6]]);
                    }

                    if (i == ruler.cells.length - 1) {
                        newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, null]]);
                    } else {
                        newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, idx + 7]]);
                    }

                    previousBlock = idx + 6;
                    sameNoteValue = 1;
                }
            }

            logo.blocks.loadNewBlocks(newStack);
            if (selectedRuler > this.Rulers.length - 2) {
                return;
            } else {
                this._saveTuplets(selectedRuler + 1);
            }
        }, 500);
    }

    /**
     * @private
     * @param {number} selectedRuler
     * @returns {void}
     */
    _saveTupletsMerged(noteValues) {
        for (const name in logo.blocks.palettes.dict) {
            logo.blocks.palettes.dict[name].hideMenu(true);
        }

        logo.refreshCanvas();

        const stack_value = _("rhythm");
        const delta = 42;
        const newStack = [
            [0, ["action", { collapsed: true }], 100 + delta, 100 + delta, [null, 1, 2, null]],
            [1, ["text", { value: stack_value }], 0, 0, [0]]
        ];
        let previousBlock = 0;
        let sameNoteValue = 1;
        for (let i = 0; i < noteValues.length; i++) {
            if (noteValues[i] === noteValues[i + 1] && i < noteValues.length - 1) {
                sameNoteValue += 1;
                continue;
            } else {
                const idx = newStack.length;
                const noteValue = noteValues[i];
                const obj = rationalToFraction(1 / Math.abs(noteValue));
                newStack.push([idx, "rhythm2", 0, 0, [previousBlock, idx + 1, idx + 2, idx + 5]]);
                newStack.push([idx + 1, ["number", { value: sameNoteValue }], 0, 0, [idx]]);
                newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);
                newStack.push([idx + 3, ["number", { value: obj[0] }], 0, 0, [idx + 2]]);
                newStack.push([idx + 4, ["number", { value: obj[1] }], 0, 0, [idx + 2]]);
                newStack.push([idx + 5, "vspace", 0, 0, [idx, idx + 6]]);

                if (i == noteValues.length - 1) {
                    newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, null]]);
                } else {
                    newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, idx + 7]]);
                }

                previousBlock = idx + 6;
                sameNoteValue = 1;
            }
        }

        logo.blocks.loadNewBlocks(newStack);
        logo.textMsg(_("New action block generated!"));
    }

    /**
     * @private
     * @param {number} selectedRuler
     * @returns {void}
     */
    _saveMachine(selectedRuler) {
        // We are either saving a drum machine or a voice machine.
        let drum;
        if (this.Drums[selectedRuler] === null) {
            drum = "snare drum";
        } else {
            const drumBlockNo = logo.blocks.blockList[this.Drums[selectedRuler]].connections[1];
            drum = logo.blocks.blockList[drumBlockNo].value;
        }

        for (let d = 0; d < DRUMNAMES.length; d++) {
            if (DRUMNAMES[d][1] === drum) {
                if (EFFECTSNAMES.indexOf(drum) === -1) {
                    this._saveDrumMachine(selectedRuler, drum, false);
                } else {
                    this._saveDrumMachine(selectedRuler, drum, true);
                }

                return;
            }
        }

        for (let d = 0; d < VOICENAMES.length; d++) {
            if (VOICENAMES[d][1] === drum) {
                this._saveVoiceMachine(selectedRuler, drum);
                return;
            }
        }
    }

    /**
     * @private
     * @param {number} selectedRuler
     * @param {string} drum
     * @param {boolean} effect
     * @returns {void}
     */
    _saveDrumMachine(selectedRuler, drum, effect) {
        for (const name in logo.blocks.palettes.dict) {
            logo.blocks.palettes.dict[name].hideMenu(true);
        }

        logo.refreshCanvas();

        setTimeout(() => {
            const ruler = this._rulers[selectedRuler];
            const noteValues = this.Rulers[selectedRuler][0];
            const delta = selectedRuler * 42;

            // Just save the action, not the drum machine itself.
            // let newStack = [[0, ['start', {'collapsed': false}], 100 + delta, 100 + delta, [null, 1, null]]];
            // newStack.push([1, 'forever', 0, 0, [0, 2, null]]);
            let action_name;
            if (this.Drums[selectedRuler] === null) {
                action_name = _("snare drum") + " " + _("action");
            } else {
                action_name =
                    logo.blocks.blockList[
                        logo.blocks.blockList[this.Drums[selectedRuler]].connections[1]
                    ].value.split(" ")[0] +
                    " " +
                    _("action");
            }

            const newStack = [
                [0, ["action", { collapsed: true }], 100 + delta, 100 + delta, [null, 1, 2, null]],
                [1, ["text", { value: action_name }], 0, 0, [0]]
            ];
            let previousBlock = 0; // 1
            let sameNoteValue = 1;
            for (let i = 0; i < ruler.cells.length; i++) {
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    sameNoteValue += 1;
                    continue;
                } else {
                    const idx = newStack.length;
                    const noteValue = noteValues[i];

                    const obj = rationalToFraction(1 / Math.abs(noteValue));

                    if (sameNoteValue === 1) {
                        // Add a note block.
                        newStack.push([
                            idx,
                            "newnote",
                            0,
                            0,
                            [previousBlock, idx + 1, idx + 4, idx + 7]
                        ]);
                        newStack.push([idx + 1, "divide", 0, 0, [idx, idx + 2, idx + 3]]);
                        newStack.push([idx + 2, ["number", { value: obj[0] }], 0, 0, [idx + 1]]);
                        if (noteValue < 0) {
                            newStack.push([
                                idx + 3,
                                ["number", { value: obj[1] }],
                                0,
                                0,
                                [idx + 1]
                            ]);
                            newStack.push([idx + 4, "vspace", 0, 0, [idx, idx + 5]]);
                            newStack.push([idx + 5, "rest2", 0, 0, [idx + 4, idx + 6]]);
                            newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, null]]);
                        } else {
                            newStack.push([
                                idx + 3,
                                ["number", { value: obj[1] }],
                                0,
                                0,
                                [idx + 1]
                            ]);
                            newStack.push([idx + 4, "vspace", 0, 0, [idx, idx + 5]]);
                            newStack.push([idx + 5, "playdrum", 0, 0, [idx + 4, idx + 6, null]]);
                            if (effect) {
                                newStack.push([
                                    idx + 6,
                                    ["effectsname", { value: drum }],
                                    0,
                                    0,
                                    [idx + 5]
                                ]);
                            } else {
                                newStack.push([
                                    idx + 6,
                                    ["drumname", { value: drum }],
                                    0,
                                    0,
                                    [idx + 5]
                                ]);
                            }
                        }
                        if (i == ruler.cells.length - 1) {
                            newStack.push([idx + 7, "hidden", 0, 0, [idx, null]]);
                        } else {
                            newStack.push([idx + 7, "hidden", 0, 0, [idx, idx + 8]]);
                            previousBlock = idx + 7;
                        }
                    } else {
                        // Add a note block inside a repeat block.
                        if (i == ruler.cells.length - 1) {
                            newStack.push([
                                idx,
                                "repeat",
                                0,
                                0,
                                [previousBlock, idx + 1, idx + 2, null]
                            ]);
                        } else {
                            newStack.push([
                                idx,
                                "repeat",
                                0,
                                0,
                                [previousBlock, idx + 1, idx + 2, idx + 10]
                            ]);
                            previousBlock = idx;
                        }
                        newStack.push([idx + 1, ["number", { value: sameNoteValue }], 0, 0, [idx]]);
                        newStack.push([idx + 2, "newnote", 0, 0, [idx, idx + 3, idx + 6, idx + 9]]);
                        newStack.push([idx + 3, "divide", 0, 0, [idx + 2, idx + 4, idx + 5]]);
                        newStack.push([idx + 4, ["number", { value: 1 }], 0, 0, [idx + 3]]);
                        if (noteValue < 0) {
                            newStack.push([
                                idx + 5,
                                ["number", { value: -noteValue }],
                                0,
                                0,
                                [idx + 3]
                            ]);
                            newStack.push([idx + 6, "vspace", 0, 0, [idx + 2, idx + 7]]);
                            newStack.push([idx + 7, "rest2", 0, 0, [idx + 6, idx + 8]]);
                            newStack.push([idx + 8, "hidden", 0, 0, [idx + 7, null]]);
                        } else {
                            newStack.push([
                                idx + 5,
                                ["number", { value: noteValue }],
                                0,
                                0,
                                [idx + 3]
                            ]);
                            newStack.push([idx + 6, "vspace", 0, 0, [idx + 2, idx + 7]]);
                            newStack.push([idx + 7, "playdrum", 0, 0, [idx + 6, idx + 8, null]]);
                            if (effect) {
                                newStack.push([
                                    idx + 8,
                                    ["effectsname", { value: drum }],
                                    0,
                                    0,
                                    [idx + 7]
                                ]);
                            } else {
                                newStack.push([
                                    idx + 8,
                                    ["drumname", { value: drum }],
                                    0,
                                    0,
                                    [idx + 7]
                                ]);
                            }
                        }
                        newStack.push([idx + 9, "hidden", 0, 0, [idx + 2, null]]);
                    }

                    sameNoteValue = 1;
                }
            }

            logo.blocks.loadNewBlocks(newStack);
            logo.textMsg(_("New action block generated!"));
            if (selectedRuler > this.Rulers.length - 2) {
                return;
            } else {
                this._saveMachine(selectedRuler + 1);
            }
        }, 500);
    }

    /**
     * @private
     * @param {number} selectedRuler
     * @param {string} voice
     * @returns {void}
     */
    _saveVoiceMachine(selectedRuler, voice) {
        for (const name in logo.blocks.palettes.dict) {
            logo.blocks.palettes.dict[name].hideMenu(true);
        }

        logo.refreshCanvas();

        setTimeout(() => {
            const ruler = this._rulers[selectedRuler];
            const noteValues = this.Rulers[selectedRuler][0];
            const delta = selectedRuler * 42;

            // Just save the action, not the drum machine itself.
            // let newStack = [[0, ['start', {'collapsed': false}], 100 + delta, 100 + delta, [null, 1, null]]];
            // newStack.push([1, 'settimbre', 0, 0, [0, 2, 4, 3]]);
            // newStack.push([2, ['voicename', {'value': voice}], 0, 0, [1]]);
            // newStack.push([3, 'hidden', 0, 0, [1, null]]);
            // newStack.push([4, 'forever', 0, 0, [1, 6, 5]]);
            // newStack.push([5, 'hidden', 0, 0, [4, null]]);

            // This should never happen.
            let action_name;
            if (this.Drums[selectedRuler] === null) {
                action_name = _("guitar") + " " + _("action");
            } else {
                action_name =
                    logo.blocks.blockList[
                        logo.blocks.blockList[this.Drums[selectedRuler]].connections[1]
                    ].value.split(" ")[0] +
                    "_" +
                    _("action");
            }

            const newStack = [
                [0, ["action", { collapsed: true }], 100 + delta, 100 + delta, [null, 1, 2, null]],
                [1, ["text", { value: action_name }], 0, 0, [0]]
            ];
            newStack.push([2, "settimbre", 0, 0, [0, 3, 5, 4]]);
            newStack.push([3, ["voicename", { value: voice }], 0, 0, [2]]);
            newStack.push([4, "hidden", 0, 0, [2, null]]);
            let previousBlock = 2;
            let sameNoteValue = 1;
            for (let i = 0; i < ruler.cells.length; i++) {
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    sameNoteValue += 1;
                    continue;
                } else {
                    const idx = newStack.length;
                    const noteValue = noteValues[i];

                    const obj = rationalToFraction(1 / Math.abs(noteValue));

                    if (sameNoteValue === 1) {
                        // Add a note block.
                        if (noteValue < 0) {
                            newStack.push([
                                idx,
                                "newnote",
                                0,
                                0,
                                [previousBlock, idx + 1, idx + 4, idx + 7]
                            ]);
                            newStack.push([idx + 1, "divide", 0, 0, [idx, idx + 2, idx + 3]]);
                            newStack.push([
                                idx + 2,
                                ["number", { value: obj[0] }],
                                0,
                                0,
                                [idx + 1]
                            ]);
                            newStack.push([
                                idx + 3,
                                ["number", { value: obj[1] }],
                                0,
                                0,
                                [idx + 1]
                            ]);
                            newStack.push([idx + 4, "vspace", 0, 0, [idx, idx + 5]]);
                            newStack.push([idx + 5, "rest2", 0, 0, [idx + 4, idx + 6]]);
                            newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, null]]);
                            if (i == ruler.cells.length - 1) {
                                newStack.push([idx + 7, "hidden", 0, 0, [idx, null]]);
                            } else {
                                newStack.push([idx + 7, "hidden", 0, 0, [idx, idx + 8]]);
                                previousBlock = idx + 7;
                            }
                        } else {
                            newStack.push([
                                idx,
                                "newnote",
                                0,
                                0,
                                [previousBlock, idx + 1, idx + 4, idx + 8]
                            ]);
                            newStack.push([idx + 1, "divide", 0, 0, [idx, idx + 2, idx + 3]]);
                            newStack.push([
                                idx + 2,
                                ["number", { value: obj[0] }],
                                0,
                                0,
                                [idx + 1]
                            ]);
                            newStack.push([
                                idx + 3,
                                ["number", { value: obj[1] }],
                                0,
                                0,
                                [idx + 1]
                            ]);
                            newStack.push([idx + 4, "vspace", 0, 0, [idx, idx + 5]]);
                            newStack.push([
                                idx + 5,
                                "pitch",
                                0,
                                0,
                                [idx + 4, idx + 6, idx + 7, null]
                            ]);
                            newStack.push([idx + 6, ["notename", { value: "C" }], 0, 0, [idx + 5]]);
                            newStack.push([idx + 7, ["number", { value: 4 }], 0, 0, [idx + 5]]);
                            if (i == ruler.cells.length - 1) {
                                newStack.push([idx + 8, "hidden", 0, 0, [idx, null]]);
                            } else {
                                newStack.push([idx + 8, "hidden", 0, 0, [idx, idx + 9]]);
                                previousBlock = idx + 8;
                            }
                        }
                    } else {
                        // Add a note block inside a repeat block.
                        if (i == ruler.cells.length - 1) {
                            newStack.push([
                                idx,
                                "repeat",
                                0,
                                0,
                                [previousBlock, idx + 1, idx + 2, null]
                            ]);
                        } else {
                            newStack.push([
                                idx,
                                "repeat",
                                0,
                                0,
                                [previousBlock, idx + 1, idx + 2, idx + 11]
                            ]);
                            previousBlock = idx;
                        }
                        newStack.push([idx + 1, ["number", { value: sameNoteValue }], 0, 0, [idx]]);
                        if (noteValue < 0) {
                            newStack.push([
                                idx + 2,
                                "newnote",
                                0,
                                0,
                                [idx, idx + 3, idx + 6, idx + 9]
                            ]);
                            newStack.push([idx + 3, "divide", 0, 0, [idx + 2, idx + 4, idx + 5]]);
                            newStack.push([idx + 4, ["number", { value: 1 }], 0, 0, [idx + 3]]);
                            newStack.push([
                                idx + 5,
                                ["number", { value: -noteValue }],
                                0,
                                0,
                                [idx + 3]
                            ]);
                            newStack.push([idx + 6, "vspace", 0, 0, [idx + 2, idx + 7]]);
                            newStack.push([idx + 7, "rest2", 0, 0, [idx + 6, idx + 8]]);
                            newStack.push([idx + 8, "hidden", 0, 0, [idx + 7, null]]);
                            newStack.push([idx + 9, "hidden", 0, 0, [idx + 2, null]]);
                        } else {
                            newStack.push([
                                idx + 2,
                                "newnote",
                                0,
                                0,
                                [idx, idx + 3, idx + 6, idx + 10]
                            ]);
                            newStack.push([idx + 3, "divide", 0, 0, [idx + 2, idx + 4, idx + 5]]);
                            newStack.push([idx + 4, ["number", { value: 1 }], 0, 0, [idx + 3]]);
                            newStack.push([
                                idx + 5,
                                ["number", { value: noteValue }],
                                0,
                                0,
                                [idx + 3]
                            ]);
                            newStack.push([idx + 6, "vspace", 0, 0, [idx + 2, idx + 7]]);
                            newStack.push([
                                idx + 7,
                                "pitch",
                                0,
                                0,
                                [idx + 6, idx + 8, idx + 9, null]
                            ]);
                            newStack.push([idx + 8, ["notename", { value: "C" }], 0, 0, [idx + 7]]);
                            newStack.push([idx + 9, ["number", { value: 4 }], 0, 0, [idx + 7]]);
                            newStack.push([idx + 10, "hidden", 0, 0, [idx + 2, null]]);
                        }
                    }

                    sameNoteValue = 1;
                }
            }

            logo.blocks.loadNewBlocks(newStack);
            if (selectedRuler > this.Rulers.length - 2) {
                return;
            } else {
                this._saveMachine(selectedRuler + 1);
            }
        }, 500);
    }

    /**
     * @private
     * @returns {array}
     */
    _mergeRulers() {
        // Merge the rulers into one set of rhythms.
        const rList = [];
        let noteValues;
        for (let r = 0; r < this.Rulers.length; r++) {
            let t = 0;
            const selectedRuler = this.Rulers[r];
            noteValues = selectedRuler[0];
            for (let i = 0; i < noteValues.length; i++) {
                t += 1 / noteValues[i];
                if (rList.indexOf(t) === -1) {
                    rList.push(t);
                }
            }
        }

        rList.sort((a, b) => {
            return a - b;
        });

        noteValues = [];
        for (let i = 0; i < rList.length; i++) {
            if (i === 0) {
                noteValues.push(1 / rList[i]);
            } else {
                noteValues.push(1 / (rList[i] - rList[i - 1]));
            }
        }

        return noteValues;
    }

    /**
     * @private
     * @returns {boolean}
     */
    _get_save_lock() {
        return this._save_lock;
    }

    /**
     * @public
     * @returns {void}
     */
    saveDissectHistory() {
        // Save the new dissect history.

        const dissectHistory = [];
        const drums = [];
        let drum;
        let history;
        for (let i = 0; i < this.Rulers.length; i++) {
            if (this.Drums[i] === null) {
                continue;
            }

            history = [];
            for (let j = 0; j < this.Rulers[i][1].length; j++) {
                history.push(this.Rulers[i][1][j]);
            }

            this._dissectNumber.classList.add("hasKeyboard");
            dissectHistory.push([history, this.Drums[i]]);
            drums.push(this.Drums[i]);
        }

        // Look for any old entries that we may have missed.
        for (let i = 0; i < this._dissectHistory.length; i++) {
            drum = this._dissectHistory[i][1];
            if (drums.indexOf(drum) === -1) {
                history = JSON.parse(JSON.stringify(this._dissectHistory[i][0]));
                dissectHistory.push([history, drum]);
            }
        }

        this._dissectHistory = JSON.parse(JSON.stringify(dissectHistory));
    }

    _piemenuRuler() {
        return; // In progress
        /*
        // piemenu version of ruler
        docById('wheelDiv2').style.display = '';
        docById('wheelDiv2').style.position = 'absolute';
        docById('wheelDiv2').style.left = '600px';
        docById('wheelDiv2').style.top = '300px';

        if (selectedRuler === undefined) {
            selectedRuler = 0;
        }

        if (this._wheel !== null) {
            this._wheel.removeWheel();
        }

        console.debug(this.Rulers[selectedRuler]);
        this._wheel = new wheelnav('wheelDiv2', null, 600, 600);
        this._wheel.wheelRadius = 200;
        this._wheel.maxPercent = 1.6;
        this._wheel.colors = [platformColor.selectorBackground, platformColor.selectorSelected];
        this._wheel.navItemsContinuous = true;
        this._wheel.markerPathFunction = markerPath().PieLineMarker;
        this._wheel.clickModeRotate = false;
        this._wheel.markerEnable = true;
        this._wheel.slicePathFunction = slicePath().DonutSlice;
        this._wheel.slicePathCustom = slicePath().DonutSliceCustomization();

        let labels = [];
        for (let i = 0; i < this.Rulers[selectedRuler][0].length; i++) {
            if (this.Rulers[selectedRuler][0][i] < 17 && this.Rulers[selectedRuler][0][i] > 0) {
                labels.push('1/' + this.Rulers[selectedRuler][0][i]);
            } else {
                labels.push(' ');
            }
        }

        console.debug(labels);
        this._wheel.initWheel(labels);

        for (let i = 0; i < this.Rulers[selectedRuler][0].length; i++) {
            this._wheel.navItems[i].sliceAngle = 360 / Math.abs(this.Rulers[selectedRuler][0][i]);
        }

        this._wheel.createWheel();
        */
    }

    /**
     * @private
     * @returns {void}
     */
    _positionWheel() {
        if (docById("wheelDiv").style.display == "none") {
            return;
        }

        docById("wheelDiv").style.position = "absolute";
        docById("wheelDiv").style.height = "300px";
        docById("wheelDiv").style.width = "300px";

        // Position the widget over the note block.
        const x = this._left + 100;
        const y = this._top;
        const selectorWidth = 150;

        docById("wheelDiv").style.left =
            Math.min(
                Math.max(x - (300 - selectorWidth) / 2, 0),
                logo.blocks.turtles._canvas.width - 300
            ) + "px";
        if (y - 300 < 0) {
            docById("wheelDiv").style.top = y + 60 + "px";
        } else {
            docById("wheelDiv").style.top = y - 300 + "px";
        }
    }
}
