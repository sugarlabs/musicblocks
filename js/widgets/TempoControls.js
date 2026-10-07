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
   _, Singer, TONEBPM
 */

/*
   Global locations
    js/turtle-singer.js
        Singer
    js/utils/utils.js
        _
    js/logoconstants.js
        TONEBPM
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
        const blockNumber = bpmBlock.connections[1];
        if (blockNumber !== null) {
            this.activity.blocks.blockList[blockNumber].value = parseFloat(this.BPMs[i]);
            this.activity.blocks.blockList[blockNumber].text.text = this.BPMs[i];
            this.activity.blocks.blockList[blockNumber].updateCache();
            this.activity.refreshCanvas();
            this.activity.saveLocally();
        }

        const bpmValue = parseFloat(this.BPMs[i]);
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
            this.activity.errorMsg(_("Please enter a number between 30 and 1000"), 3000);
            return;
        }

        this.BPMs[i] = Number(this.BPMInputs[i].value);
        if (this.BPMs[i] > 1000) {
            this.BPMs[i] = 1000;
            this.activity.errorMsg(_("The beats per minute must be between 30 and 1000."), 3000);
        } else if (this.BPMs[i] < 30) {
            this.BPMs[i] = 30;
            this.activity.errorMsg(_("The beats per minute must be between 30 and 1000."), 3000);
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

        if (this.BPMs[i] > 1000) {
            this.activity.errorMsg(_("The beats per minute must be below 1000."), 3000);
            this.BPMs[i] = 1000;
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
        if (this.BPMs[i] < 30) {
            this.activity.errorMsg(_("The beats per minute must be above 30"), 3000);
            this.BPMs[i] = 30;
        }

        this._updateBPM(i);
        this.BPMInputs[i].value = this.BPMs[i];
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = TempoControls;
}
