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

   _, frequencyToPitch, PitchStaircase
*/
/*
    Globals location
    - js/utils/utils.js
        _
    - js/utils/musicutils-pitch.js
        frequencyToPitch
    - js/widgets/pitchstaircase.js
        PitchStaircase
*/

/* exported PitchStaircaseSteps */

/**
 * @file PitchStaircaseSteps.js
 * @description Pitch Staircase steps: making a new step by applying the ratio to a stair, and
 * undoing steps.
 *
 * The methods are moved as they were from the PitchStaircase class, which copies them onto
 * PitchStaircase.prototype (see PitchStaircase.installModules), so `this` is still the widget.
 */
class PitchStaircaseSteps {
    /**
     * Removes the last step made.
     * @private
     * @returns {boolean} Whether there was a step to remove.
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
     * Makes a new step from the clicked stair by applying the ratio in the two inputs.
     * @private
     * @param {Event} event - The click on a stair.
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
        if (
            !Number.isFinite(newFrequency) ||
            newFrequency < PitchStaircase.MIN_FREQUENCY ||
            newFrequency > PitchStaircase.MAX_FREQUENCY
        ) {
            const act = this.activity || (typeof activity !== "undefined" ? activity : null);
            if (act && typeof act.textMsg === "function") {
                act.textMsg(
                    _("Frequency is outside supported range (27.5 Hz - 16744.04 Hz)."),
                    3000
                );
            }
            return;
        }

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
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = PitchStaircaseSteps;
}
