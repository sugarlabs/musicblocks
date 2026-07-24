// Copyright (c) 2016-2021 Walter Bender
// Copyright (c) 2016 Hemant Kasat
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget enable us to create new pitches with help of a initial
// pitch value by applying music ratios.

/*
   global

   platformColor, _, SYNTHSVG, frequencyToPitch, DEFAULTVOICE,
   normalizeNoteAccidentals, PREVIEWVOLUME, Singer, last
 */

/*
   Global locations
    - js/utils/musicutils.js
        SYNTHSVG, frequencyToPitch, DEFAULTVOICE
    - js/utils/utils.js
        _, last
    - js/utils/platformstyle.js
        platformColor
    - js/logoconstants.js
        PREVIEWVOLUME
    - js/turtle-singer.js
        Singer
*/
/* exported PitchStaircase */

class PitchStaircase {
    static BUTTONDIVWIDTH = 476; // 8 buttons 476 = (55 + 4) * 8
    static OUTERWINDOWWIDTH = 685;
    static INNERWINDOWWIDTH = 600;
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;
    static DEFAULTFREQUENCY = 220.0;

    /**
     * @constructor
     */
    constructor() {
        this.Stairs = [];
        this.stairPitchBlocks = [];
        this._stepTables = [];
        this._musicRatio1 = null;
        this._musicRatio2 = null;
        this._playingRowIndex = null;
        this._rowStopTimeout = null;
        this._isPlayingAll = false;
        this._playAllTimeout = null;
        this._isPlayingScale = false;
        this._scaleStopped = false;
        this._scaleTimeout = null;
    }

    /**
     * @private
     * @param {Row} row
     * @param {string} icon
     * @param {number} iconSize
     * @param {string} label
     * @returns {Cell}
     */
    _addButton(row, icon, iconSize, label) {
        const cell = row.insertCell(-1);
        cell.replaceChildren(
            document.createTextNode("\u00a0\u00a0"),
            (() => {
                const img = document.createElement("img");
                img.src = "header-icons/" + icon;
                img.title = label;
                img.alt = label;
                img.height = iconSize;
                img.width = iconSize;
                img.style.verticalAlign = "middle";
                img.style.alignContent = "center";
                return img;
            })(),
            document.createTextNode("\u00a0\u00a0")
        );
        cell.style.width = PitchStaircase.BUTTONSIZE + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.classList.add("pitch-staircase-btn");

        return cell;
    }

    /**
     * @private
     * @param {Cell} cell
     * @param {string} icon
     * @param {string} label
     * @returns {void}
     */
    _setButtonIcon(cell, icon, label) {
        if (!cell || typeof cell.replaceChildren !== "function") {
            return;
        }
        const img = document.createElement("img");
        img.src = "header-icons/" + icon;
        img.title = label;
        img.alt = label;
        img.height = PitchStaircase.ICONSIZE;
        img.width = PitchStaircase.ICONSIZE;
        img.style.verticalAlign = "middle";
        img.style.alignContent = "center";

        if (cell.classList.contains("pitch-staircase-btn")) {
            cell.replaceChildren(
                document.createTextNode("\u00a0\u00a0"),
                img,
                document.createTextNode("\u00a0\u00a0")
            );
        } else {
            cell.replaceChildren(img);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _makeStairs() {
        /**
         * Each row in the psc table contains separate table; each table contains a note label in
         * the first column and a table of buttons in the second column.
         */
        const pscTable = this._pscTable;
        pscTable.replaceChildren();
        pscTable.style.textAlign = "center";

        for (let i = 0; i < this.Stairs.length; i++) {
            const pscTableRow = pscTable.insertRow();
            const pscTableCell = pscTableRow.insertCell();
            const stepTable = document.createElement("table");
            this._stepTables[i] = stepTable;
            pscTableCell.append(stepTable);

            const stepTableRow = stepTable.insertRow();

            const frequency = this.Stairs[i][2];

            // The play button for this row.
            const playCell = this._addButton(
                stepTableRow,
                "play-button.svg",
                PitchStaircase.ICONSIZE,
                _("Play")
            );
            playCell.className = "headcol"; // This cell is fixed horizontally.
            playCell.setAttribute("id", i);
            playCell.style.cursor = "pointer";
            const stepCell = stepTableRow.insertCell();
            stepCell.setAttribute("id", frequency);
            stepCell.style.width =
                (PitchStaircase.INNERWINDOWWIDTH *
                    parseFloat(PitchStaircase.DEFAULTFREQUENCY / frequency) *
                    this._cellScale) /
                    3 +
                "px";
            stepCell.replaceChildren(
                document.createTextNode(frequency.toFixed(2)),
                document.createElement("br"),
                document.createTextNode(this.Stairs[i][0] + this.Stairs[i][1])
            );
            stepCell.style.minWidth = stepCell.style.width;
            stepCell.style.maxWidth = stepCell.style.width;
            stepCell.style.height = PitchStaircase.BUTTONSIZE + "px";
            stepCell.classList.add("pitch-staircase-step");

            const cellWidth = Number(stepCell.style.width.replace(/px/, ""));
            const svgWidth = cellWidth.toString();
            const svgScale = (cellWidth / 55).toString();
            const svgStrokeWidth = ((3 * 55) / cellWidth).toString();
            const svgData =
                "data:image/svg+xml;base64," +
                window.btoa(
                    base64Encode(
                        SYNTHSVG.replace(/SVGWIDTH/g, svgWidth)
                            .replace(/XSCALE/g, svgScale)
                            .replace(/STOKEWIDTH/g, svgStrokeWidth)
                    )
                );
            stepCell.style.backgroundImage = "url(" + svgData + ")";
            stepCell.style.backgroundRepeat = "no-repeat";
            stepCell.style.backgroundPosition = "center center";

            stepCell.addEventListener("click", event => {
                this._dissectStair(event);
            });

            playCell.onclick = () => {
                const i = Number(playCell.getAttribute("id"));
                const stepCell = this._stepTables[i].rows[0].cells[1];
                if (this._playingRowIndex === i) {
                    clearTimeout(this._rowStopTimeout);
                    stepCell.classList.remove("active");
                    stepCell.style.backgroundColor = "";
                    this._setButtonIcon(playCell, "play-button.svg", _("Play"));
                    this.activity.logo.synth.stop();
                    this._playingRowIndex = null;
                } else {
                    this._playOne(stepCell, playCell);
                }
            };
        }
    }

    /**
     * @private
     * @returns {boolean}
     */
    _undo() {
        if (this._history.length === 0) {
            return false;
        }

        // Remove the last entry...
        const i = this._history.pop();
        this.Stairs.splice(i, 1);

        // And rebuild the stairs.
        this._refresh();

        return true;
    }

    /**
     * @private
     * @param {Event} event
     * @returns {void}
     */
    _dissectStair(event) {
        let inputNum1 = this._musicRatio1.value;

        if (isNaN(inputNum1) || Number(inputNum1) <= 0) {
            inputNum1 = 3;
        } else {
            inputNum1 = Math.floor(inputNum1);
        }

        this._musicRatio1.value = inputNum1;
        let inputNum2 = this._musicRatio2.value;

        if (isNaN(inputNum2) || Number(inputNum2) <= 0) {
            inputNum2 = 2;
        } else {
            inputNum2 = Math.floor(inputNum2);
        }

        this._musicRatio2.value = inputNum2;
        const inputNum = parseFloat(inputNum2 / inputNum1);

        const oldcell = event.target;
        const frequency = Number(oldcell.getAttribute("id"));

        // Look for the Stair with this frequency.
        let n;
        for (n = 0; n < this.Stairs.length; n++) {
            if (this.Stairs[n][2] === frequency) {
                break;
            }
        }

        if (n === this.Stairs.length) {
            return;
        }

        const newFrequency = parseFloat(frequency) / inputNum;
        const obj = frequencyToPitch(newFrequency);
        let foundStep = false;
        let repeatStep = false;
        let isStepDeleted = true;
        let i;

        // Snapshot the source stair's metadata before any splice so that
        // inserting at index i < n does not shift n and corrupt the values.
        const srcNumerator = this.Stairs[n][3];
        const srcDenominator = this.Stairs[n][4];
        const srcFrequency = this.Stairs[n][2];
        const srcOctave = this.Stairs[n][6];

        for (i = 0; i < this.Stairs.length; i++) {
            // Check if the frequency is effectively the same (within epsilon)
            if (Math.abs(this.Stairs[i][2] - newFrequency) < 0.001) {
                this.Stairs.splice(i, 1, [
                    obj[0],
                    obj[1],
                    newFrequency,
                    srcNumerator * parseFloat(inputNum2),
                    srcDenominator * parseFloat(inputNum1),
                    srcFrequency,
                    srcOctave
                ]);
                foundStep = true;
                repeatStep = true;
                isStepDeleted = false;
                break;
            }

            if (this.Stairs[i][2] < newFrequency) {
                this.Stairs.splice(i, 0, [
                    obj[0],
                    obj[1],
                    newFrequency,
                    srcNumerator * parseFloat(inputNum2),
                    srcDenominator * parseFloat(inputNum1),
                    srcFrequency,
                    srcOctave
                ]);
                foundStep = true;
                break;
            }
        }

        if (!foundStep) {
            this.Stairs.push([
                obj[0],
                obj[1],
                newFrequency,
                srcNumerator * parseFloat(inputNum2),
                srcDenominator * parseFloat(inputNum1),
                srcFrequency,
                srcOctave
            ]);
            this._history.push(this.Stairs.length - 1);
        } else {
            if (!repeatStep) {
                this._history.push(i);
            }
        }

        this._makeStairs(isStepDeleted);
    }

    /**
     * @private
     * @param {Cell} stepcell
     * @returns {void}
     */
    _playOne(stepCell, playCell) {
        // The frequency is stored in the stepCell.
        stepCell.classList.add("active");
        stepCell.style.backgroundColor = platformColor.selectorBackgroundHOVER;
        const i = Number(playCell.getAttribute("id"));
        this._playingRowIndex = i;
        const frequency = Number(stepCell.getAttribute("id"));
        this.activity.logo.synth.trigger(0, frequency, 1, DEFAULTVOICE, null, null);
        this._setButtonIcon(playCell, "stop-button.svg", _("Stop"));

        this._rowStopTimeout = setTimeout(() => {
            stepCell.classList.remove("active");
            stepCell.style.backgroundColor = "";
            this._setButtonIcon(playCell, "play-button.svg", _("Play"));
            this._playingRowIndex = null;
        }, 1000);
    }

    /**
     * @private
     * @returns {void}
     */
    _playAll() {
        const pitchnotes = [];
        this._isPlayingAll = true;
        if (this._playAllButton) {
            this._setButtonIcon(
                this._isPlayingAll ? this._playAllButton : null,
                "stop-button.svg",
                _("Stop")
            );
        }

        for (let i = 0; i < this.Stairs.length; i++) {
            const note = this.Stairs[i][0] + this.Stairs[i][1];
            pitchnotes.push(normalizeNoteAccidentals(note));
            const stepCell = this._stepTables[i].rows[0].cells[1];
            stepCell.classList.add("active");
            this.activity.logo.synth.trigger(0, pitchnotes, 1, DEFAULTVOICE, null, null);
        }

        this._playAllTimeout = setTimeout(() => {
            for (let i = 0; i < this.Stairs.length; i++) {
                const stepCell = this._stepTables[i].rows[0].cells[1];
                stepCell.classList.remove("active");
            }
            if (this._playAllButton) {
                this._setButtonIcon(this._playAllButton, "play-chord.svg", _("Play chord"));
            }
            this._isPlayingAll = false;
        }, 1000);
    }

    /**
     * @private
     * @returns {void}
     */
    playUpAndDown() {
        this._scaleStopped = false;
        this._isPlayingScale = true;
        if (this._playScaleButton) {
            this._setButtonIcon(this._playScaleButton, "stop-button.svg", _("Stop"));
        }
        const pitchnotes = [];
        const note =
            this.Stairs[this.Stairs.length - 1][0] + this.Stairs[this.Stairs.length - 1][1];
        pitchnotes.push(normalizeNoteAccidentals(note));
        const last = this.Stairs.length - 1;
        const stepCell = this._stepTables[last].rows[0].cells[1];
        stepCell.classList.add("active");
        this.activity.logo.synth.trigger(0, pitchnotes, 1, DEFAULTVOICE, null, null);
        this._playNext(this.Stairs.length - 2, -1);
    }

    /**
     * @private
     * @param {number} index
     * @param {number} next
     * @returns {void}
     */
    _playNext(index, next) {
        if (this.closed || this._scaleStopped) return;

        if (index === this.Stairs.length) {
            const timeoutId = setTimeout(() => {
                for (let i = 0; i < this.Stairs.length; i++) {
                    const stepCell = this._stepTables[i].rows[0].cells[1];
                    stepCell.classList.remove("active");
                }
                if (this._playScaleButton) {
                    this._setButtonIcon(this._playScaleButton, "play-scale.svg", _("Play scale"));
                }
                this._isPlayingScale = false;
            }, 1000);
            if (this._playScaleButton) {
                this._scaleTimeout = timeoutId;
            }
            return;
        }

        if (index === -1) {
            const t1 = setTimeout(() => {
                for (let i = 0; i < this.Stairs.length; i++) {
                    const stepCell = this._stepTables[i].rows[0].cells[1];
                    stepCell.classList.remove("active");
                }
            }, 1000);
            if (this._playScaleButton) {
                this._scaleTimeout = t1;
            }

            const t2 = setTimeout(() => {
                this._playNext(0, 1);
            }, 200);
            if (this._playScaleButton) {
                this._scaleTimeout = t2;
            }

            return;
        }

        const pitchnotes = [];
        const note = this.Stairs[index][0] + this.Stairs[index][1];
        pitchnotes.push(normalizeNoteAccidentals(note));
        const previousRowNumber = index - next;
        // _stepTables is a dense array; a negative index yields undefined,
        // not null, so use != null (loose) to catch both.
        const pscTableCell = previousRowNumber >= 0 ? this._stepTables[previousRowNumber] : null;

        const t3 = setTimeout(() => {
            if (this.closed || this._scaleStopped) return;
            if (pscTableCell !== null && pscTableCell !== undefined) {
                const stepCell = pscTableCell.rows[0].cells[1];
                stepCell.classList.remove("active");
            }

            const stepCell = this._stepTables[index].rows[0].cells[1];
            stepCell.classList.add("active");
            this.activity.logo.synth.trigger(0, pitchnotes, 1, DEFAULTVOICE, null, null);
            // Use && so playback terminates when index reaches either boundary;
            // the boundary cases (=== -1 and === Stairs.length) are already
            // handled by the early-return guards at the top of this function.
            if (index > -1 && index < this.Stairs.length) {
                this._playNext(index + next, next);
            }
        }, 1000);
        if (this._playScaleButton) {
            this._scaleTimeout = t3;
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _save() {
        for (const name in this.activity.palettes.dict) {
            this.activity.palettes.dict[name].hideMenu(true);
        }

        this.activity.refreshCanvas();
        const newStack = [
            [
                0,
                [
                    "action",
                    {
                        collapsed: true
                    }
                ],
                100,
                100,
                [null, 1, 2, null]
            ],
            [
                1,
                [
                    "text",
                    {
                        value: "stair"
                    }
                ],
                0,
                0,
                [0]
            ]
        ];
        let previousBlock = 0;

        for (let i = 0; i < this.Stairs.length; i++) {
            const frequency = this.Stairs[i][2];
            const pitch = frequencyToPitch(frequency);

            // If cents === 0, then output a pitch block; otherwise,
            // output a hertz block <-- initial frequency x numerator
            // / denominator, followed by two vspace blocks.
            let pitchBlockIdx;
            let hertzBlockIdx;
            let noteIdx;
            let octaveIdx;
            let hiddenIdx;
            let hiddenBlockName;
            let multiplyIdx;
            let frequencyIdx;
            let divideIdx;
            let numeratorIdx;
            let denominatorIdx;
            let vspaceIdx;

            if (pitch[2] === 0) {
                pitchBlockIdx = newStack.length;
                hertzBlockIdx = pitchBlockIdx;
                noteIdx = pitchBlockIdx + 1;
                octaveIdx = pitchBlockIdx + 2;
                hiddenIdx = pitchBlockIdx + 3;
                hiddenBlockName = "hidden";

                newStack.push([
                    hertzBlockIdx,
                    "pitch",
                    0,
                    0,
                    [previousBlock, noteIdx, octaveIdx, hiddenIdx]
                ]);
                newStack.push([
                    noteIdx,
                    [
                        "notename",
                        {
                            value: pitch[0]
                        }
                    ],
                    0,
                    0,
                    [pitchBlockIdx]
                ]);
                newStack.push([
                    octaveIdx,
                    [
                        "number",
                        {
                            value: pitch[1]
                        }
                    ],
                    0,
                    0,
                    [pitchBlockIdx]
                ]);
            } else {
                hertzBlockIdx = newStack.length;
                multiplyIdx = hertzBlockIdx + 1;
                frequencyIdx = hertzBlockIdx + 2;
                divideIdx = hertzBlockIdx + 3;
                numeratorIdx = hertzBlockIdx + 4;
                denominatorIdx = hertzBlockIdx + 5;
                vspaceIdx = hertzBlockIdx + 6;
                hiddenIdx = hertzBlockIdx + 7;
                hiddenBlockName = "vspace";
                newStack.push([
                    hertzBlockIdx,
                    "hertz",
                    0,
                    0,
                    [previousBlock, multiplyIdx, vspaceIdx]
                ]);
                newStack.push([
                    multiplyIdx,
                    "multiply",
                    0,
                    0,
                    [hertzBlockIdx, frequencyIdx, divideIdx]
                ]);
                newStack.push([
                    frequencyIdx,
                    [
                        "number",
                        {
                            value: this.Stairs[i][6].toFixed(2)
                        }
                    ],
                    0,
                    0,
                    [multiplyIdx]
                ]);
                newStack.push([
                    divideIdx,
                    "divide",
                    0,
                    0,
                    [multiplyIdx, numeratorIdx, denominatorIdx]
                ]);
                newStack.push([
                    numeratorIdx,
                    [
                        "number",
                        {
                            value: this.Stairs[i][4]
                        }
                    ],
                    0,
                    0,
                    [divideIdx]
                ]);
                newStack.push([
                    denominatorIdx,
                    [
                        "number",
                        {
                            value: this.Stairs[i][3]
                        }
                    ],
                    0,
                    0,
                    [divideIdx]
                ]);
                newStack.push([vspaceIdx, "vspace", 0, 0, [hertzBlockIdx, hiddenIdx]]);
                // The hidden block will connect here.
                hertzBlockIdx = vspaceIdx;
            }

            if (i === this.Stairs.length - 1) {
                newStack.push([hiddenIdx, hiddenBlockName, 0, 0, [hertzBlockIdx, null]]);
            } else {
                newStack.push([hiddenIdx, hiddenBlockName, 0, 0, [hertzBlockIdx, hiddenIdx + 1]]);
            }

            previousBlock = hiddenIdx;
        }

        this.activity.blocks.loadNewBlocks(newStack);
        activity.textMsg(_("New action block generated."), 3000);
    }

    /**
     * @private
     * @returns {boolean}
     */
    _get_save_lock() {
        return this._save_lock;
    }

    /**
     * @private
     * @returns {void}
     */
    init(activity) {
        this.activity = activity;

        for (let i = 0; i < this.Stairs.length; i++) {
            this.Stairs[i].push(this.Stairs[i][2]); // initial frequency
            this.Stairs[i].push(this.Stairs[i][2]); // parent frequency
        }

        // this._initialFrequency = this.Stairs[0][2];
        this._history = [];

        const w = window.innerWidth;
        this._cellScale = w / 1200;

        const widgetWindow = window.widgetWindows.windowFor(
            this,
            "pitch staircase",
            "pitch staircase",
            true
        );
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        widgetWindow.onclose = () => {
            this.closed = true;
            clearTimeout(this._rowStopTimeout);
            clearTimeout(this._playAllTimeout);
            clearTimeout(this._scaleTimeout);
            this._scaleStopped = true;
            this._isPlayingAll = false;
            this._isPlayingScale = false;
            this._playingRowIndex = null;
            this.activity.logo.synth.stop();
            // Restore the project's master volume so audio still works
            // after exiting mid-playback (was incorrectly left at PREVIEWVOLUME).
            this.activity.logo.synth.setMasterVolume(last(Singer.masterVolume));
            widgetWindow.destroy();
        };

        this.closed = false;
        this.activity.logo.synth.setMasterVolume(PREVIEWVOLUME);

        this._playAllButton = widgetWindow.addButton(
            "play-chord.svg",
            PitchStaircase.ICONSIZE,
            _("Play chord")
        );
        this._playAllButton.onclick = () => {
            if (this._isPlayingAll) {
                clearTimeout(this._playAllTimeout);
                for (let i = 0; i < this.Stairs.length; i++) {
                    const stepCell = this._stepTables[i].rows[0].cells[1];
                    stepCell.classList.remove("active");
                }
                this._setButtonIcon(this._playAllButton, "play-chord.svg", _("Play chord"));
                this.activity.logo.synth.stop();
                this._isPlayingAll = false;
            } else {
                this._playAll();
            }
        };

        this._playScaleButton = widgetWindow.addButton(
            "play-scale.svg",
            PitchStaircase.ICONSIZE,
            _("Play scale")
        );
        this._playScaleButton.onclick = () => {
            if (this._isPlayingScale) {
                this._scaleStopped = true;
                clearTimeout(this._scaleTimeout);
                for (let i = 0; i < this.Stairs.length; i++) {
                    const stepCell = this._stepTables[i].rows[0].cells[1];
                    stepCell.classList.remove("active");
                }
                this._setButtonIcon(this._playScaleButton, "play-scale.svg", _("Play scale"));
                this.activity.logo.synth.stop();
                this._isPlayingScale = false;
            } else {
                this.playUpAndDown();
            }
        };

        this._save_lock = false;
        widgetWindow.addButton("export-chunk.svg", PitchStaircase.ICONSIZE, _("Save")).onclick =
            () => {
                // Debounce button
                if (!this._get_save_lock()) {
                    this._save_lock = true;
                    this._save();
                    setTimeout(() => {
                        this._save_lock = false;
                    }, 1000);
                }
            };
        const wfbWidget = document.getElementsByClassName("wfbWidget")[0];
        wfbWidget.style.maxHeight = 10 * PitchStaircase.BUTTONSIZE + "px";
        wfbWidget.style.overflowY = "scroll";
        this._musicRatio1 = widgetWindow.addInputButton("3");
        widgetWindow.addDivider();
        this._musicRatio2 = widgetWindow.addInputButton("2");

        widgetWindow.addButton("restore-button.svg", PitchStaircase.ICONSIZE, _("Undo")).onclick =
            () => {
                this._undo();
            };

        widgetWindow.addButton("erase-button.svg", PitchStaircase.ICONSIZE, _("Clear")).onclick =
            () => {
                while (this._undo());
            };

        // The pitch-staircase (psc) table
        this._pscTable = document.createElement("table");
        widgetWindow.getWidgetBody().append(this._pscTable);
        this._refresh();

        activity.textMsg(_("Click on a note to create a new step."), 3000);

        widgetWindow.onmaximize = () => {
            if (widgetWindow._maximized) {
                wfbWidget.style.maxHeight = 16 * PitchStaircase.BUTTONSIZE + "px";
            } else {
                wfbWidget.style.maxHeight = 10 * PitchStaircase.BUTTONSIZE + "px";
            }
        };
    }

    /**
     * @private
     * @returns {void}
     */
    _refresh() {
        this._makeStairs(true);
    }
}
if (typeof module !== "undefined") {
    module.exports = PitchStaircase;
}
