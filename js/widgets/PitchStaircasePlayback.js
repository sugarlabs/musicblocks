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

   _, platformColor, DEFAULTVOICE
*/
/*
    Globals location
    - js/utils/utils.js
        _
    - js/utils/platformstyle.js
        platformColor
    - js/utils/musicutils-constants.js
        DEFAULTVOICE
*/

/* exported PitchStaircasePlayback */

/**
 * @file PitchStaircasePlayback.js
 * @description Pitch Staircase playback: playing one stair, all the stairs as a chord, and the
 * stairs as a scale down and back up, and stopping each of them.
 *
 * Every stair is played at its own frequency, so steps made with a ratio sound exactly as shown
 * rather than at the nearest note.
 *
 * The methods are moved as they were from the PitchStaircase class, which copies them onto
 * PitchStaircase.prototype (see PitchStaircase.installModules), so `this` is still the widget.
 */
class PitchStaircasePlayback {
    /**
     * Plays one stair for a second.
     * @private
     * @param {HTMLTableCellElement} stepCell - The stair, which holds its frequency as its id.
     * @param {HTMLTableCellElement} playCell - The stair's play button, which holds its row.
     * @returns {void}
     */
    _playOne(stepCell, playCell) {
        // Only one stair plays at a time; otherwise the earlier one's timeout would reset the
        // playing row while this one is still sounding.
        if (this._playingRowIndex !== null) {
            this._stopRow();
        }

        // The frequency is stored in the stepCell.
        stepCell.classList.add("active");
        stepCell.style.backgroundColor = platformColor.selectorBackgroundHOVER;
        const i = Number(playCell.getAttribute("id"));
        this._playingRowIndex = i;
        const frequency = Number(stepCell.getAttribute("id"));
        this.activity.logo.synth.trigger(0, frequency, 1, DEFAULTVOICE, null, null);
        this._setButtonIcon(playCell, "stop-button.svg", _("Stop"));

        this._rowStopTimeout = this._setWidgetTimeout(() => {
            stepCell.classList.remove("active");
            stepCell.style.backgroundColor = "";
            this._setButtonIcon(playCell, "play-button.svg", _("Play"));
            this._playingRowIndex = null;
        }, 1000);
    }

    /**
     * Stops the stair that is playing.
     * @private
     * @returns {void}
     */
    _stopRow() {
        const i = this._playingRowIndex;
        this._clearWidgetTimeout(this._rowStopTimeout);
        this._rowStopTimeout = null;
        this._playingRowIndex = null;

        const stepTable = this._stepTables[i];
        if (!stepTable || !stepTable.rows || !stepTable.rows[0]) {
            return;
        }

        const playCell = stepTable.rows[0].cells[0];
        const stepCell = stepTable.rows[0].cells[1];
        stepCell.classList.remove("active");
        stepCell.style.backgroundColor = "";
        this._setButtonIcon(playCell, "play-button.svg", _("Play"));
        const frequency = Number(stepCell.getAttribute("id"));
        this.activity.logo.synth.stopSound(0, DEFAULTVOICE, frequency);
    }

    /**
     * Plays every stair together as a chord for a second.
     * @private
     * @returns {void}
     */
    _playAll() {
        const frequencies = [];
        this._isPlayingAll = true;
        if (this._playAllButton) {
            this._setButtonIcon(
                this._isPlayingAll ? this._playAllButton : null,
                "stop-button.svg",
                _("Stop")
            );
        }

        for (let i = 0; i < this.Stairs.length; i++) {
            frequencies.push(this.Stairs[i][2]);
            const stepCell = this._stepTables[i].rows[0].cells[1];
            stepCell.classList.add("active");
        }

        if (frequencies.length > 0) {
            this.activity.logo.synth.trigger(0, frequencies, 1, DEFAULTVOICE, null, null);
        }

        this._playAllTimeout = this._setWidgetTimeout(() => {
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
     * Stops the chord.
     * @private
     * @returns {void}
     */
    _stopChord() {
        this._clearWidgetTimeout(this._playAllTimeout);
        this._playAllTimeout = null;
        for (let i = 0; i < this.Stairs.length; i++) {
            const stepCell = this._stepTables[i].rows[0].cells[1];
            stepCell.classList.remove("active");
        }
        this._setButtonIcon(this._playAllButton, "play-chord.svg", _("Play chord"));
        this.activity.logo.synth.stopSound(0, DEFAULTVOICE);
        this._isPlayingAll = false;
    }

    /**
     * Plays the stairs as a scale, from the lowest up to the highest and back down.
     * @returns {void}
     */
    playUpAndDown() {
        if (this.Stairs.length === 0) {
            return;
        }

        this._scaleStopped = false;
        this._isPlayingScale = true;
        if (this._playScaleButton) {
            this._setButtonIcon(this._playScaleButton, "stop-button.svg", _("Stop"));
        }
        const last = this.Stairs.length - 1;
        const stepCell = this._stepTables[last].rows[0].cells[1];
        stepCell.classList.add("active");
        this.activity.logo.synth.trigger(0, [this.Stairs[last][2]], 1, DEFAULTVOICE, null, null);
        this._playNext(this.Stairs.length - 2, -1);
    }

    /**
     * Plays the next stair of the scale after a second.
     * @private
     * @param {number} index - The stair to play.
     * @param {number} next - The direction: -1 going up the scale, 1 coming back down.
     * @returns {void}
     */
    _playNext(index, next) {
        if (this.closed || this._scaleStopped) return;

        if (index === this.Stairs.length) {
            const completionTimeout = this._setWidgetTimeout(() => {
                if (this.closed || this._scaleStopped) return;
                for (let i = 0; i < this.Stairs.length; i++) {
                    if (
                        this._stepTables[i] &&
                        this._stepTables[i].rows &&
                        this._stepTables[i].rows[0] &&
                        this._stepTables[i].rows[0].cells[1]
                    ) {
                        const stepCell = this._stepTables[i].rows[0].cells[1];
                        stepCell.classList.remove("active");
                    }
                }
                if (this._playScaleButton) {
                    this._setButtonIcon(this._playScaleButton, "play-scale.svg", _("Play scale"));
                }
                this._isPlayingScale = false;
            }, 1000);
            if (this._playScaleButton) {
                this._scaleStepTimeout = completionTimeout;
            }
            return;
        }

        if (index === -1) {
            const highlightCleanupTimeout = this._setWidgetTimeout(() => {
                if (this.closed || this._scaleStopped) return;
                for (let i = 0; i < this.Stairs.length; i++) {
                    if (
                        this._stepTables[i] &&
                        this._stepTables[i].rows &&
                        this._stepTables[i].rows[0] &&
                        this._stepTables[i].rows[0].cells[1]
                    ) {
                        const stepCell = this._stepTables[i].rows[0].cells[1];
                        stepCell.classList.remove("active");
                    }
                }
            }, 1000);
            if (this._playScaleButton) {
                this._scaleHighlightTimeout = highlightCleanupTimeout;
            }

            const initialStepTimeout = this._setWidgetTimeout(() => {
                if (this.closed || this._scaleStopped) return;
                this._playNext(0, 1);
            }, 200);
            if (this._playScaleButton) {
                this._scaleStepTimeout = initialStepTimeout;
            }

            return;
        }

        const frequencies = [this.Stairs[index][2]];
        const previousRowNumber = index - next;
        // _stepTables is a dense array; a negative index yields undefined,
        // not null, so use != null (loose) to catch both.
        const pscTableCell = previousRowNumber >= 0 ? this._stepTables[previousRowNumber] : null;

        const stepTimeout = this._setWidgetTimeout(() => {
            if (this.closed || this._scaleStopped) return;
            if (
                pscTableCell !== null &&
                pscTableCell !== undefined &&
                pscTableCell.rows &&
                pscTableCell.rows[0] &&
                pscTableCell.rows[0].cells[1]
            ) {
                const stepCell = pscTableCell.rows[0].cells[1];
                stepCell.classList.remove("active");
            }

            if (
                this._stepTables[index] &&
                this._stepTables[index].rows &&
                this._stepTables[index].rows[0] &&
                this._stepTables[index].rows[0].cells[1]
            ) {
                const stepCell = this._stepTables[index].rows[0].cells[1];
                stepCell.classList.add("active");
            }
            this.activity.logo.synth.trigger(0, frequencies, 1, DEFAULTVOICE, null, null);
            // Use && so playback terminates when index reaches either boundary;
            // the boundary cases (=== -1 and === Stairs.length) are already
            // handled by the early-return guards at the top of this function.
            if (index > -1 && index < this.Stairs.length) {
                this._playNext(index + next, next);
            }
        }, 1000);
        if (this._playScaleButton) {
            this._scaleStepTimeout = stepTimeout;
        }
    }

    /**
     * Stops the scale.
     * @private
     * @returns {void}
     */
    _stopScale() {
        this._scaleStopped = true;
        this._clearWidgetTimeout(this._scaleStepTimeout);
        this._clearWidgetTimeout(this._scaleHighlightTimeout);
        this._scaleStepTimeout = null;
        this._scaleHighlightTimeout = null;
        for (let i = 0; i < this.Stairs.length; i++) {
            if (
                this._stepTables[i] &&
                this._stepTables[i].rows &&
                this._stepTables[i].rows[0] &&
                this._stepTables[i].rows[0].cells[1]
            ) {
                const stepCell = this._stepTables[i].rows[0].cells[1];
                stepCell.classList.remove("active");
            }
        }
        this._setButtonIcon(this._playScaleButton, "play-scale.svg", _("Play scale"));
        this.activity.logo.synth.stopSound(0, DEFAULTVOICE);
        this._isPlayingScale = false;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = PitchStaircasePlayback;
}
