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
   _, Singer, TONEBPM, rationalToFraction
 */

/*
   Global locations
    js/turtle-singer.js
        Singer
    js/utils/utils.js
        _
    js/logoconstants.js
        TONEBPM
    js/utils/utils-logic.js
        rationalToFraction
*/

/* exported TempoControls */

/**
 * @file TempoControls.js
 * @description Tempo widget BPM controls: speeding up and slowing down a row, typing a BPM, and
 * applying a row's new BPM to its metronome, its BPM block and the running tempo.
 *
 * The methods are moved as they were from the Tempo class, which copies them onto
 * Tempo.prototype (see Tempo.installModules), so `this` is still the widget.
 */
class TempoControls {
    /**
     * The beat value of a row's BPM block. The block's BPM counts beats of this length, so 120
     * with a beat value of 1/8 is 60 quarter notes per minute.
     * @private
     * @param {number} i - The row.
     * @returns {number} The beat value, 1/4 if the block didn't give a positive number.
     */
    _beatValue(i) {
        const beatValue = this.beatValues ? this.beatValues[i] : undefined;
        return Number.isFinite(beatValue) && beatValue > 0 ? beatValue : 0.25;
    }

    /**
     * The slowest and fastest BPM of a row. The tempo must be 30 to 1000 quarter notes per
     * minute, like the BPM blocks check, so with a beat value of 1/8 the row allows 60 to 2000.
     * @private
     * @param {number} i - The row.
     * @returns {number[]} The lowest and highest BPM.
     */
    _bpmLimits(i) {
        const beatValue = this._beatValue(i);
        return [(30 * 0.25) / beatValue, (1000 * 0.25) / beatValue];
    }

    /**
     * Tells the user a row's BPM was out of range: msg for a beat value of 1/4, else the limit
     * in the row's beats, in the words the BPM blocks use.
     * @private
     * @param {number} i - The row.
     * @param {string} msg - The message for a beat value of 1/4.
     * @param {boolean} tooFast - Whether the BPM was above the limit rather than below it.
     * @returns {void}
     */
    _bpmRangeError(i, msg, tooFast) {
        const beatValue = this._beatValue(i);
        if (beatValue !== 0.25) {
            const [minBPM, maxBPM] = this._bpmLimits(i);
            const obj = rationalToFraction(beatValue);
            const beat = obj[0] + "/" + obj[1];
            msg = tooFast
                ? _("maximum") +
                  " " +
                  beat +
                  " " +
                  _("beats per minute is %s").replace(/%s/g, maxBPM)
                : beat + " " + _("beats per minute must be greater than %s").replace(/%s/g, minBPM);
        }
        this.activity.errorMsg(msg, null, null, 3000);
    }

    /**
     * @private
     * @param {number} i
     * @returns {void}
     */
    _updateBPM(i) {
        this._intervals[i] = (60 / this.BPMs[i]) * 1000;

        if (!this.BPMBlocks || this.BPMBlocks[i] === null || this.BPMBlocks[i] === undefined) {
            return;
        }

        const bpmBlock = this.activity.blocks.blockList[this.BPMBlocks[i]];
        if (!bpmBlock) return;
        // Only a number block holds the BPM. An expression such as 60 x 2 works its value out
        // again on the next run, so writing into it would be lost, and would label the operator
        // block with the number.
        const blockNumber = bpmBlock.connections[1];
        const numberBlock =
            blockNumber !== null ? this.activity.blocks.blockList[blockNumber] : null;
        if (numberBlock && numberBlock.name === "number") {
            numberBlock.value = parseFloat(this.BPMs[i]);
            numberBlock.text.text = this.BPMs[i];
            numberBlock.updateCache();
            this.activity.refreshCanvas();
            this.activity.saveLocally();
        }

        // The running tempo is in quarter notes, so convert with the block's beat value, as
        // running the block does (MeterActions.setMasterBPM and setBPM).
        const bpmValue = (parseFloat(this.BPMs[i]) * this._beatValue(i)) / 0.25;
        if (bpmBlock.name === "setmasterbpm2" || bpmBlock.name === "setmasterbpm") {
            Singer.masterBPM = bpmValue;
            Singer.defaultBPMFactor = TONEBPM / bpmValue;
        } else if (bpmBlock.name === "setbpm3" || bpmBlock.name === "setbpm2") {
            // Only the turtle that ran the block: other start blocks keep their own tempo.
            const turtle = this.BPMTurtles ? this.BPMTurtles[i] : null;
            const isCurrent = turtle && this.activity.turtles.turtleList.includes(turtle);
            if (isCurrent && turtle.singer && turtle.singer.bpm.length > 0) {
                turtle.singer.bpm[turtle.singer.bpm.length - 1] = bpmValue;
            }
        }
    }

    /**
     * @private
     * @param {number} i
     * @returns {void}
     */
    _useBPM(i) {
        const input = this.BPMInputs[i].value;

        if (isNaN(input)) {
            this.activity.errorMsg(
                _("Please enter a number between 30 and 1000"),
                null,
                null,
                3000
            );
            return;
        }

        this.BPMs[i] = Number(this.BPMInputs[i].value);
        const [minBPM, maxBPM] = this._bpmLimits(i);
        if (this.BPMs[i] > maxBPM) {
            this.BPMs[i] = maxBPM;
            this._bpmRangeError(i, _("The beats per minute must be between 30 and 1000."), true);
        } else if (this.BPMs[i] < minBPM) {
            this.BPMs[i] = minBPM;
            this._bpmRangeError(i, _("The beats per minute must be between 30 and 1000."), false);
        }

        this._updateBPM(i);
        this.BPMInputs[i].value = this.BPMs[i];
    }

    /**
     * @public
     * @param {number} i
     * @param {number} [step]
     * @returns {void}
     */
    speedUp(i, step) {
        const delta = step !== undefined ? step : Math.round(0.1 * this.BPMs[i]);
        this.BPMs[i] = parseFloat(this.BPMs[i]) + delta;

        const maxBPM = this._bpmLimits(i)[1];
        if (this.BPMs[i] > maxBPM) {
            this._bpmRangeError(i, _("The beats per minute must be below 1000."), true);
            this.BPMs[i] = maxBPM;
        }

        this._updateBPM(i);
        this.BPMInputs[i].value = this.BPMs[i];
    }

    /**
     * @public
     * @param {number} i
     * @param {number} [step]
     * @returns {void}
     */
    slowDown(i, step) {
        const delta = step !== undefined ? step : Math.round(0.1 * this.BPMs[i]);
        this.BPMs[i] = parseFloat(this.BPMs[i]) - delta;
        const minBPM = this._bpmLimits(i)[0];
        if (this.BPMs[i] < minBPM) {
            this._bpmRangeError(i, _("The beats per minute must be above 30"), false);
            this.BPMs[i] = minBPM;
        }

        this._updateBPM(i);
        this.BPMInputs[i].value = this.BPMs[i];
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = TempoControls;
}
