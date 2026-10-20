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

   _, delayExecution, docById, calcNoteValueToDisplay, platformColor, EIGHTHNOTEWIDTH,
   clampNumber, announceToScreenReader, RhythmRuler
*/
/*
    Globals location
    - js/utils/utils.js
        _, docById, delayExecution, announceToScreenReader
    - js/utils/utils-logic.js
        clampNumber
    - js/utils/musicutils.js
        calcNoteValueToDisplay, EIGHTHNOTEWIDTH
    - js/utils/platformstyle.js
        platformColor
    - js/widgets/rhythmruler.js
        RhythmRuler
*/

/* exported RhythmRulerLayout */

/**
 * @file RhythmRulerLayout.js
 * @description Rhythm Maker layout: the widget window and its toolbar, the ruler table, note widths
 * and scaling, the zebra striping of cells, and placing the pie menu wheel.
 *
 * The methods are moved as they were from the RhythmRuler class, which copies them onto
 * RhythmRuler.prototype (see RhythmRuler.installModules), so `this` is still the widget.
 */
class RhythmRulerLayout {
    /**
     * Creates the widget window, wires its close/maximize handlers, and adds
     * the toolbar buttons (play all, save rhythms, save drum machine, dissect
     * number input, undo, tap, clear, circular view toggle).
     * @private
     * @returns {WidgetWindow} The created widget window.
     */
    _createWidgetWindow() {
        /**
         * Size of the icons.
         * @type {number}
         * @const
         */
        const iconSize = RhythmRuler.ICONSIZE;

        /**
         * Reference to the widget window.
         * @type {WidgetWindow}
         */
        const widgetWindow = window.widgetWindows.windowFor(this, "rhythm maker");
        announceToScreenReader(_("Rhythm Maker opened"));
        /**
         * The widget window associated with the rhythm maker.
         * @type {WidgetWindow}
         * @private
         */
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        // For the button callbacks
        /**
         * Callback function for the close event of the widget window.
         * @type {function}
         * @private
         */
        widgetWindow.onclose = () => {
            if (this._keyHandler) {
                document.removeEventListener("keydown", this._keyHandler, true);
                this._keyHandler = null;
            }
            if (this._playing) {
                this.__pause();
            }
            this._clearWidgetTimers();
            this.saveDissectHistory();

            this._playing = false;
            this._playingOne = false;
            this._playingAll = false;
            this.activity.hideMsgs();
            this._cleanupCircularCanvas();
            this._circularView = false;
            announceToScreenReader(_("Rhythm Maker closed"));

            this.widgetWindow.destroy();
        };

        /**
         * Handles the maximize event of the widget window, scaling the widget.
         * @private
         * @returns {void}
         */
        this.widgetWindow.onmaximize = this._scale.bind(this);
        /**
         * Represents the play all button.
         * @private
         * @type {HTMLElement}
         */
        this._playAllCell = widgetWindow.addButton("play-button.svg", iconSize, _("Play all"));
        /**
         * Callback function for the click event of the play all button.
         * @private
         * @returns {void}
         */
        this._playAllCell.onclick = () => {
            if (this._playing) {
                this.__pause();
            } else if (!this._playingAll) {
                this.__resume();
            }
        };

        /**
         * Represents the flag indicating whether saving is locked to prevent multiple save attempts.
         * @private
         * @type {boolean}
         */
        this._save_lock = false;
        /**
         * Event handler for the click event of the save rhythms button.
         * Saves a merged version of the rulers.
         * @private
         * @returns {void}
         */
        widgetWindow.addButton("export-chunk.svg", iconSize, _("Save rhythms")).onclick =
            async () => {
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

        /**
         * Event handler for the click event of the save drum machine button.
         * Saves the drum machine.
         * @private
         * @returns {void}
         */
        widgetWindow.addButton("export-drums.svg", iconSize, _("Save drum machine")).onclick =
            async () => {
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

        // Make the input editable and handle keyboard input
        this._dissectNumber.readOnly = false;
        this._dissectNumber.classList.add("hasKeyboard");
        this._dissectNumber.style.cursor = "text";

        // Handle Enter key to validate and blur (prevent any play action)
        this._dissectNumber.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                const inputValue = parseInt(this._dissectNumber.value, 10);
                if (!isNaN(inputValue) && inputValue > 0) {
                    // Validate the input value - allow any number from 2 to 128
                    const validatedValue = clampNumber(inputValue, 2, 128);
                    this._dissectNumber.value = validatedValue;
                }
                this._dissectNumber.blur();
            }
        });

        /**
         * Event handler for the click event of the dissect number input.
         * Shows a pie menu for selecting the rhythm division number.
         * @private
         * @returns {void}
         */
        this._dissectNumber.onclick = () => {
            this._showDissectNumberPieMenu();
        };

        /**
         * Event handler for the click event of the undo button.
         * Undoes the last action.
         * @private
         * @returns {void}
         */
        widgetWindow.addButton("restore-button.svg", iconSize, _("Undo")).onclick = () => {
            this._undo();
        };

        //.TRANS: user can tap out a rhythm by clicking on a ruler.
        /**
         * Event handler for the click event of the tap rhythm button.
         * Calls the _tap method to allow users to tap out a rhythm by clicking on a ruler.
         * @private
         * @returns {void}
         */
        this._tapButton = widgetWindow.addButton("tap-button.svg", iconSize, _("Tap a rhythm"));
        this._tapButton.onclick = () => {
            this._tap();
        };

        //.TRANS: clear all subdivisions from the ruler.
        /**
         * Event handler for the click event of the clear button.
         * Calls the _clear method to clear all subdivisions from the ruler.
         * @private
         * @returns {void}
         */
        widgetWindow.addButton("erase-button.svg", iconSize, _("Clear")).onclick = () => {
            this._clear();
        };

        this._circularToggle = widgetWindow.addButton("circle.svg", iconSize, _("Circular view"));
        this._circularToggle.onclick = () => {
            this._circularView = !this._circularView;
            this._toggleCircularView();
        };

        if (this._keyHandler) {
            document.removeEventListener("keydown", this._keyHandler, true);
            this._keyHandler = null;
        }

        this._keyHandler = event => {
            if (
                typeof window === "undefined" ||
                !window.widgetWindows ||
                window.widgetWindows.focused !== widgetWindow
            ) {
                return;
            }

            const activity = this.activity || this._activity;
            if (
                activity &&
                activity.blocks &&
                activity.blocks.activeBlock !== null &&
                activity.blocks.activeBlock !== undefined
            ) {
                return;
            }

            const activeElement = document.activeElement;
            if (
                activeElement &&
                (activeElement.tagName === "INPUT" ||
                    activeElement.tagName === "TEXTAREA" ||
                    activeElement.isContentEditable)
            ) {
                return;
            }

            if (
                activeElement &&
                (activeElement.tagName === "BUTTON" || activeElement.tagName === "SELECT")
            ) {
                return;
            }

            if (event.key === " " || event.code === "Space" || event.keyCode === 32) {
                event.preventDefault();
                event.stopPropagation();
                if (event.repeat) {
                    return;
                }
                if (this._playAllCell && typeof this._playAllCell.onclick === "function") {
                    this._playAllCell.onclick();
                } else if (this._playing) {
                    this.__pause();
                } else if (!this._playingAll) {
                    this.__resume();
                }
            }
        };

        document.addEventListener("keydown", this._keyHandler, true);

        return widgetWindow;
    }

    /**
     * Builds the <table> of rhythm rulers: one row per drum, each with a
     * play button in the first column and that drum's ruler cells (one per
     * note-value division) in the second.
     * @private
     * @param {WidgetWindow} widgetWindow - The widget window created by _createWidgetWindow().
     * @returns {void}
     */
    _buildRulerTable(widgetWindow) {
        /**
         * Represents the table containing the rhythm rulers.
         * The table has an outer div for vertical scrolling and an inner div for horizontal scrolling.
         * @type {HTMLTableElement}
         */
        const rhythmRulerTable = document.createElement("table");
        this._rhythmRulerTable = rhythmRulerTable;
        widgetWindow.getWidgetBody().append(rhythmRulerTable);

        /**
         * The maximum width of the rhythm ruler table.
         * @type {number}
         */
        let wMax = 0;
        // Each row in the ruler table contains a play button in the
        // first column and a ruler table in the second column.
        for (let i = 0; i < this.Rulers.length; i++) {
            const rhythmRulerTableRow = rhythmRulerTable.insertRow();

            if (this.activity.beginnerMode === true || this.activity.beginnerMode === "true") {
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
                this._setButtonIcon(drumcell, "play-button.svg", _("Play"), false);
                drumcell.className = "headcol"; // Position fixed when scrolling horizontally
                drumcell.style.cursor = "pointer";
                drumcell.onclick = (id => {
                    return () => {
                        if (this._playing) {
                            if (this._rulerPlaying === id) {
                                this._setButtonIcon(drumcell, "play-button.svg", _("Play"));
                                this._playing = false;
                                this._playingOne = false;
                                this._playingAll = false;
                                this._rulerPlaying = -1;
                                this._startingTime = null;
                                this._elapsedTimes[id] = 0;
                                this._offsets[id] = 0;
                                this._clearWidgetTimers();
                                this._setWidgetTimeout(() => this._calculateZebraStripes(id), 1000);
                            }
                        } else if (this._playingOne === false) {
                            this._clearWidgetTimers();
                            this._rulerSelected = id;
                            this.activity.logo.turtleDelay = 0;
                            this._playing = true;
                            this._playingOne = true;
                            this._playingAll = false;
                            this._cellCounter = 0;
                            this._startingTime = null;
                            this._rulerPlaying = id;
                            this._setButtonIcon(drumcell, "pause-button.svg", _("Pause"));
                            this._elapsedTimes[id] = 0;
                            this._offsets[id] = 0;
                            this._playOne();
                        }
                    };
                })(i);
            }

            const rulerCell = rhythmRulerTableRow.insertCell();
            // Create individual rulers as tables.
            rulerCell.replaceChildren();
            const rulerCellTable = document.createElement("table");
            rulerCellTable.id = "rulerCellTable" + i;
            rulerCell.appendChild(rulerCellTable);

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
                this.__setNoteValueDisplay(rulerSubCell, noteValue, 1);
                rulerSubCell.style.height = RhythmRuler.RULERHEIGHT + "px";
                rulerSubCell.style.minHeight = rulerSubCell.style.height;
                rulerSubCell.style.maxHeight = rulerSubCell.style.height;
                rulerSubCell.style.width = this._noteWidth(noteValue) + "px";
                rulerSubCell.style.minWidth = rulerSubCell.style.width;
                rulerSubCell.style.border = "0px";
                rulerSubCell.border = "0px";
                rulerSubCell.padding = "0px";
                rulerSubCell.style.padding = "0px";
                rulerSubCell.style.lineHeight = "60%";
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
    }

    /**
     * Calculates the width of a note cell based on the note value.
     * @private
     * @param {number} noteValue - The value of the note.
     * @returns {number} The width of the note cell.
     */
    _noteWidth(noteValue) {
        const ans = Math.floor(
            EIGHTHNOTEWIDTH *
                (8 / Math.abs(noteValue)) *
                (this.widgetWindow.isMaximized() ? this._fullscreenScaleFactor : 3)
        );
        return ans;
    }

    /**
     * Renders the note value display returned by calcNoteValueToDisplay without
     * inserting raw HTML into the widget.
     * @private
     * @param {HTMLTableCellElement} cell - The rhythm cell to update.
     * @param {number} numerator - The numerator passed to calcNoteValueToDisplay.
     * @param {number} denominator - The denominator passed to calcNoteValueToDisplay.
     * @param {string} [suffix] - Optional text appended after the note value.
     * @returns {void}
     */
    __setNoteValueDisplay(cell, numerator, denominator, suffix) {
        const noteValueToDisplay = calcNoteValueToDisplay(numerator, denominator);
        const parts = noteValueToDisplay.split("<br>");

        cell.textContent = "";
        for (let i = 0; i < parts.length; i++) {
            let part = parts[i];
            if (part === "&mdash;") part = "\u2014";

            cell.appendChild(document.createTextNode(part));
            if (i < parts.length - 1) cell.appendChild(document.createElement("br"));
        }

        if (suffix !== undefined) {
            cell.appendChild(document.createTextNode(" " + suffix));
        }
    }

    /**
     * Scales the width of the note cells based on the window size.
     * @private
     * @returns {void}
     */
    _scale() {
        if (this.widgetWindow.isMaximized()) {
            const width = this.widgetWindow.getWidgetBody().getBoundingClientRect().width;
            this._fullscreenScaleFactor = Math.floor(width / (EIGHTHNOTEWIDTH * 8));
        }
        this._rulers.forEach(ruler => {
            if (this.widgetWindow.isMaximized()) {
                Array.prototype.forEach.call(ruler.children, child => {
                    child.style.width =
                        Number(child.style.width.slice(0, child.style.width.indexOf("px"))) *
                            (this._fullscreenScaleFactor / 3) +
                        "px";
                    child.style.minWidth = child.style.width;
                });
            } else {
                Array.prototype.forEach.call(ruler.children, child => {
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
     * Shows a pie menu for selecting the rhythm dissect number.
     * Displays different options based on beginner mode.
     * @private
     * @returns {void}
     */
    _showDissectNumberPieMenu() {
        piemenuDissectNumber(this);
    }

    /**
     * Calculates and applies zebra stripes to the ruler cells for visual differentiation.
     * @private
     * @param {number} rulerno - The index of the ruler.
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
     * Positions the wheel widget.
     * @private
     * @returns {void}
     */
    _positionWheel() {
        if (docById("wheelDiv").style.display === "none") {
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
            Math.min(Math.max(x - (300 - selectorWidth) / 2, 0), this.activity.canvas.width - 300) +
            "px";
        if (y - 300 < 0) {
            docById("wheelDiv").style.top = y + 60 + "px";
        } else {
            docById("wheelDiv").style.top = y - 300 + "px";
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = RhythmRulerLayout;
}
