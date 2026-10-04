/**
 * MusicBlocks
 *
 * @copyright 2016-21 Walter Bender
 * @copyright 2016 Hemant Kasat
 * @copyright 2026 Music Blocks contributors
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
   global

   Singer, _, platformColor, last, nearestBeat, rationalToFraction, RhythmRuler
*/
/*
    Globals location
    - js/turtle-singer.js
        Singer
    - js/utils/utils.js
        _, last, nearestBeat, rationalToFraction
    - js/utils/platformstyle.js
        platformColor
    - js/widgets/rhythmruler.js
        RhythmRuler
*/

/* exported RhythmRulerEditing */

/**
 * @file RhythmRulerEditing.js
 * @description Rhythm Maker editing the rulers: dissecting cells, tapping out a rhythm, the cell
 * mouse and touch handlers, rests, dividing by a list or a number, ties, undo and
 * clear.
 *
 * The methods are moved as they were from the RhythmRuler class, which copies them onto
 * RhythmRuler.prototype (see RhythmRuler.installModules), so `this` is still the widget.
 */
class RhythmRulerEditing {
    /**
     * Dissects a ruler cell based on the input number or tapping mode.
     * @private
     * @param {Event} event - The triggering event.
     * @param {string} ruler - The index of the ruler.
     * @returns {void}
     */
    _dissectRuler(event, ruler) {
        const cell = event.currentTarget || event.target;
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
        if (this._rulerSelected === undefined) {
            return;
        }

        if (this._playing) {
            // console.warn("You cannot dissect while widget is playing.");
            return;
        } else if (this._tapMode) {
            // Tap a rhythm by clicking in a cell.
            if (this._tapCell === null) {
                const noteValues = this.Rulers[this._rulerSelected][0];
                this._tapCell = cell;
                if (noteValues[this._tapCell.cellIndex] < 0) {
                    // Don't allow tapping in rests.
                    this._tapCell = null;
                    this._tapMode = false;
                    this._tapTimes = [];
                    this._tapEndTime = null;
                    this._setButtonIcon(this._tapButton, "tap-button.svg", _("tap a rhythm"));
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
                        this.activity.blocks.blockList[this.Drums[this._rulerSelected]]
                            .connections[1];
                    drum = this.activity.blocks.blockList[drumBlockNo].value;
                }

                // Get the meter from the current turtle's singer
                const turtle = this.activity.turtles.ithTurtle(0);
                const beatsPerMeasure = turtle.singer.beatsPerMeasure || 4;

                // Play count-off based on meter (e.g., 4 beats for 4/4, 3 beats for 3/4)
                for (let i = 0; i < beatsPerMeasure; i++) {
                    this._setWidgetTimeout(
                        () => {
                            this.activity.logo.synth.trigger(
                                0,
                                "C4",
                                Singer.defaultBPMFactor / 16,
                                drum,
                                null,
                                null
                            );
                        },
                        (interval * i) / beatsPerMeasure
                    );
                }

                this._setWidgetTimeout(() => {
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

        //Save dissect history everytime user dissects ruler
        this.saveDissectHistory();
    }

    /**
     * Starts the tapping process.
     * @private
     * @param {number} interval - The interval between taps.
     * @param {Event} event - The triggering event.
     * @returns {void}
     */
    __startTapping(interval, event) {
        const d = new Date();
        this._tapTimes = [d.getTime()];
        this._tapEndTime = this._tapTimes[0] + interval;

        // Set a timeout to end tapping
        this._setWidgetTimeout(() => {
            this.__endTapping(event);
        }, interval);

        // Display a progress bar.
        const __move = (tick, stepSize) => {
            let width = 1;

            const id = this._setWidgetInterval(() => {
                if (width >= 100) {
                    this._clearWidgetInterval(id);
                } else {
                    width += stepSize;
                    this._progressBar.style.width = width + "%";
                }
            }, tick);
        };

        this._tapCell.replaceChildren();
        const progressDiv = document.createElement("div");
        progressDiv.className = "progressBar";
        this._tapCell.appendChild(progressDiv);
        this._progressBar = this._tapCell.querySelector(".progressBar");
        // Progress once per 8th note.
        __move(interval / 8, 100 / 8);
    }

    /**
     * Ends the tapping process and calculates the rhythm based on the tapped intervals.
     * @private
     * @param {Event} event - The triggering event.
     * @returns {void}
     */
    __endTapping(event) {
        const cell = event.currentTarget || event.target;
        if (cell.parentNode === null) {
            return;
        }

        this._rulerSelected = cell.parentNode.getAttribute("data-row");
        if (this._progressBar) this._progressBar.remove();
        this._tapCell.textContent = "";

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
        this._setButtonIcon(this._tapButton, "tap-button.svg", _("tap a rhythm"));
    }

    /**
     * Adds event handlers for mouse interactions with a rhythm cell.
     * @private
     * @param {HTMLElement} cell - The HTML element representing the rhythm cell.
     * @param {number} cellWidth - The width of the rhythm cell.
     * @param {number} noteValue - The value representing the note in the rhythm cell.
     * @returns {void}
     */
    __addCellEventHandlers(cell, cellWidth, noteValue) {
        // Allow horizontal panning (pan-x) on cells so wide ruler patterns
        // can still be scrolled on mobile when they overflow the viewport,
        // while still suppressing pinch-zoom on individual cells.
        cell.style.touchAction = "pan-x";

        const __mouseOverHandler = event => {
            const cell = event.currentTarget;
            if (cell === null || cell.parentNode === null) {
                return;
            }

            this._rulerSelected = cell.parentNode.getAttribute("data-row");
            const noteValues = this.Rulers[this._rulerSelected][0];
            const noteValue = noteValues[cell.cellIndex];
            let obj;
            if (noteValue < 0) {
                obj = rationalToFraction(Math.abs(Math.abs(-1 / noteValue)));
                this.__setNoteValueDisplay(cell, obj[1], obj[0], _("silence"));
            } else {
                obj = rationalToFraction(Math.abs(Math.abs(1 / noteValue)));
                this.__setNoteValueDisplay(cell, obj[1], obj[0]);
            }
        };

        const __mouseOutHandler = event => {
            const cell = event.currentTarget;
            cell.textContent = "";
        };

        const __mouseDownHandler = event => {
            const cell = event.currentTarget;
            this._mouseDownCell = cell;

            const d = new Date();
            this._longPressStartTime = d.getTime();
            this._inLongPress = false;

            this._longPressBeep = this._setWidgetTimeout(() => {
                // Removing audio feedback on long press since it
                // occasionally confuses tone.js during rapid clicking
                // in the widget.

                // this.activity.logo.synth.trigger(0, 'C4', 1 / 32, 'chime', null, null);

                const cell = this._mouseDownCell;
                if (cell !== null && cell.parentNode !== null) {
                    this._rulerSelected = cell.parentNode.getAttribute("data-row");
                    // const noteValues = this.Rulers[this._rulerSelected][0];
                    cell.style.backgroundColor = platformColor.selectorBackground;
                }
            }, 1500);
        };

        /**
         * Handles the mouseup event on a rhythm cell, determining actions based on the interaction.
         * @private
         * @param {Event} event - The mouseup event.
         * @returns {void}
         */
        const __mouseUpHandler = event => {
            this._clearWidgetTimeout(this._longPressBeep);
            this._longPressBeep = null;
            // On touch with Pointer Events, the browser implicitly captures the
            // pointer to the pointerdown target, so event.target is always the
            // cell that received pointerdown — meaning drag-across-cells-to-tie
            // would never fire on mobile. elementFromPoint resolves the actual
            // element under the finger at release time for both mouse and touch.
            const cell = document.elementFromPoint(event.clientX, event.clientY) || event.target;
            this._mouseUpCell = cell;
            if (this._mouseDownCell !== this._mouseUpCell) {
                this._tieRuler(event, cell.parentNode.getAttribute("data-row"));
            } else if (this._longPressStartTime !== null && !this._tapMode) {
                const d = new Date();
                const elapseTime = d.getTime() - this._longPressStartTime;
                if (elapseTime > 1500) {
                    this._inLongPress = true;
                    this.__toggleRestState(cell, true);
                }
            }

            this._mouseDownCell = null;
            this._mouseUpCell = null;
            this._longPressStartTime = null;
        };

        /**
         * Handles the click event on a rhythm cell, triggering the dissecting action.
         * @private
         * @param {Event} event - The click event.
         * @returns {void}
         */
        const __clickHandler = event => {
            if (event === undefined) return;
            if (!this.__getLongPressStatus()) {
                const cell = event.currentTarget;
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
            this.__setNoteValueDisplay(cell, obj[1], obj[0]);
        } else {
            cell.textContent = "";

            cell.removeEventListener("mouseover", __mouseOverHandler);
            cell.addEventListener("mouseover", __mouseOverHandler);

            cell.removeEventListener("mouseout", __mouseOutHandler);
            cell.addEventListener("mouseout", __mouseOutHandler);
        }

        // Use Pointer Events API instead of legacy mouse events so that rhythm
        // cells respond to touchscreen taps and stylus input as well as mouse
        // clicks.  The Pointer Events spec guarantees these fire for all input
        // device types on modern browsers.
        cell.removeEventListener("pointerdown", __mouseDownHandler);
        cell.addEventListener("pointerdown", __mouseDownHandler);

        cell.removeEventListener("pointerup", __mouseUpHandler);
        cell.addEventListener("pointerup", __mouseUpHandler);

        cell.removeEventListener("click", __clickHandler);
        cell.addEventListener("click", __clickHandler);
    }

    /**
     * Gets the current status of the long press.
     * @private
     * @returns {boolean} - The status of the long press.
     */
    __getLongPressStatus() {
        return this._inLongPress;
    }

    /**
     * Toggles the rest state of a rhythm cell.
     * @private
     * @param {HTMLElement} cell - The HTML element representing the rhythm cell.
     * @param {boolean} addToUndoList - Indicates whether to add the action to the undo list.
     * @returns {void}
     */
    __toggleRestState(cell, addToUndoList) {
        if (cell !== null && cell.parentNode !== null && cell.parentNode !== undefined) {
            this._rulerSelected = cell.parentNode.getAttribute("data-row");
            const noteValues = this.Rulers[this._rulerSelected][0];
            const noteValue = noteValues[cell.cellIndex];

            /**
             * Handles the mouseover event for the rhythm cell.
             * @param {Event} event - The mouseover event.
             * @returns {void}
             */
            const __mouseOverHandler = event => {
                const cell = event.currentTarget;
                if (cell === null) {
                    return;
                }

                let obj;

                this._rulerSelected = cell.parentNode.getAttribute("data-row");
                const noteValues = this.Rulers[this._rulerSelected][0];
                const noteValue = noteValues[cell.cellIndex];
                if (noteValue < 0) {
                    obj = rationalToFraction(Math.abs(Math.abs(-1 / noteValue)));
                    this.__setNoteValueDisplay(cell, obj[1], obj[0], _("silence"));
                } else {
                    obj = rationalToFraction(Math.abs(Math.abs(1 / noteValue)));
                    this.__setNoteValueDisplay(cell, obj[1], obj[0]);
                }
            };

            /**
             * Handles the mouseout event for the rhythm cell.
             * @param {Event} event - The mouseout event.
             * @returns {void}
             */
            const __mouseOutHandler = event => {
                const cell = event.currentTarget;
                cell.textContent = "";
            };

            let obj;
            if (noteValue < 0) {
                obj = rationalToFraction(Math.abs(1 / noteValue));
                this.__setNoteValueDisplay(cell, obj[1], obj[0]);
                cell.removeEventListener("mouseover", __mouseOverHandler);
                cell.removeEventListener("mouseout", __mouseOutHandler);
            } else {
                cell.textContent = "";

                cell.removeEventListener("mouseover", __mouseOverHandler);
                cell.addEventListener("mouseover", __mouseOverHandler);

                cell.removeEventListener("mouseout", __mouseOutHandler);
                cell.addEventListener("mouseout", __mouseOutHandler);
            }

            noteValues[cell.cellIndex] = -noteValue;

            this._calculateZebraStripes(this._rulerSelected);
            this._refreshCircularView();

            const divisionHistory = this.Rulers[this._rulerSelected][1];
            if (addToUndoList) {
                this._undoList.push(["rest", this._rulerSelected]);
            }

            divisionHistory.push(cell.cellIndex);
        }
    }

    /**
     * Divides a rhythm cell into multiple cells based on a list of new note values.
     * @private
     * @param {HTMLElement} cell - The HTML element representing the rhythm cell to be divided.
     * @param {number[]} newNoteValues - An array containing the new note values to divide the cell into.
     * @param {boolean} addToUndoList - Indicates whether to add the action to the undo list.
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
            this._refreshCircularView();
        }
    }

    /**
     * Dissects a rhythm cell by dividing it into a specified number of sub-cells.
     * @private
     * @param {HTMLElement} cell - The HTML element representing the rhythm cell to be dissected.
     * @param {number} inputNum - The number of sub-cells to divide the rhythm cell into.
     * @param {boolean} addToUndoList - Indicates whether to add the action to the undo list.
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
                this.activity.errorMsg(_("Maximum value of 256 has been exceeded."));
                return;
            } else {
                this.activity.hideMsgs();
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
            this._refreshCircularView();
        }
    }

    /**
     * Ties together adjacent rhythm cells.
     * @private
     * @param {Event} event - The triggering event.
     * @param {string} ruler - The ruler identifier.
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
        const cell = event.currentTarget || event.target;
        if (cell !== null && cell.parentNode !== null) {
            this._rulerSelected = cell.parentNode.getAttribute("data-row");
            this.__tie(true);
        }
    }

    /**
     * Handles tying together adjacent rhythm cells.
     * @private
     * @param {boolean} addToUndoList - Indicates whether to add the action to the undo list.
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
                tmp = this._mouseDownCell;
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
            this._refreshCircularView();
        }
    }

    /**
     * Undoes the last action performed on the rhythm ruler.
     * @private
     * @returns {void}
     */
    _undo() {
        this.activity.logo.synth.stop();
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
            this.__setNoteValueDisplay(newCell, oldCellNoteValue / inputNum, 1);

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
            this.__setNoteValueDisplay(newCell, obj[1], obj[0]);

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
                    this.__setNoteValueDisplay(newCell, history[i][1], 1);

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
        this._refreshCircularView();
    }

    /**
     * Activates the tap mode for tapping rhythms.
     * @private
     * @returns {void}
     */
    _tap() {
        this._tapMode = true;
        this._setButtonIcon(this._tapButton, "tap-active-button.svg", _("tap a rhythm"));
    }

    /**
     * Clears the rhythm ruler, stopping any playing and resetting all values.
     * @private
     * @returns {void}
     */
    _clear() {
        this.activity.logo.synth.stop();
        this.activity.logo.resetSynth(0);
        this._playing = false;
        this._playingAll = false;
        this._playingOne = false;
        this._rulerPlaying = -1;
        this._startingTime = null;
        this._setButtonIcon(this._playAllCell, "play-button.svg", _("Play all"));
        for (let r = 0; r < this.Rulers.length; r++) {
            this._rulerSelected = r;
            while (this.Rulers[r][1].length > 0) {
                this._undo();
            }
        }

        this._refreshCircularView();
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = RhythmRulerEditing;
}
