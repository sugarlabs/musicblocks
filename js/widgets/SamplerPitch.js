// Copyright (c) 2021 Liza Malykhina
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

   DOUBLEFLAT, FLAT, SHARP, DOUBLESHARP, Singer
*/
/*
    Globals location
    - js/utils/musicutils.js
        DOUBLEFLAT, FLAT, SHARP, DOUBLESHARP
    - js/turtle-singer.js
        Singer
*/

/* exported SamplerPitch */

/**
 * @file SamplerPitch.js
 * @description Sampler widget pitch selection: the pitch, accidental and octave chosen for the sample, the frequency they give, and the timbre.
 *
 * The methods are moved as they were from the SampleWidget constructor. The constructor calls
 * SamplerPitch.install.call(this, deps), so `this` is still the widget.
 */

const SamplerPitch = {
    /**
     * Adds these methods to a SampleWidget instance.
     * @param {Object} deps - Values from the SampleWidget constructor's scope.
     * @param {*} deps.EXPORTACCIDENTALNAMES - The constructor's EXPORTACCIDENTALNAMES.
     * @param {*} deps.ACCIDENTALNAMES - The constructor's ACCIDENTALNAMES.
     * @param {*} deps.SOLFEGENAMES - The constructor's SOLFEGENAMES.
     * @param {*} deps.PITCHNAMES - The constructor's PITCHNAMES.
     * @param {*} deps.MAJORSCALE - The constructor's MAJORSCALE.
     * @returns {void}
     */
    install(deps) {
        const { EXPORTACCIDENTALNAMES, ACCIDENTALNAMES, SOLFEGENAMES, PITCHNAMES, MAJORSCALE } =
            deps;

        /**
         * Sets the pitch center for the sample.
         * @param {string} p - The pitch to set as the center.
         * @returns {void}
         */
        this._usePitch = function (p) {
            const number = SOLFEGENAMES.indexOf(p);
            this.pitchCenter = number === -1 ? 0 : number;
        };

        /**
         * Sets the accidental center for the sample.
         * @param {string} a - The accidental to set as the center.
         * @returns {void}
         */
        this._useAccidental = function (a) {
            const number = ACCIDENTALNAMES.indexOf(a);
            this.accidentalCenter = number === -1 ? 2 : number;
        };

        /**
         * Sets the octave center for the sample.
         * @param {string} o - The octave to set as the center.
         * @returns {void}
         */
        this._useOctave = function (o) {
            this.octaveCenter = parseInt(o, 10);
        };

        /**
         * Parses the sample pitch and sets the pitch, accidental, and octave centers accordingly.
         * @returns {void}
         */
        this._parseSamplePitch = function () {
            const first_part = this.samplePitch.substring(0, 2);
            if (first_part === "so") {
                this.pitchCenter = 4;
            } else {
                this.pitchCenter = SOLFEGENAMES.indexOf(first_part);
            }

            const sol = this.samplePitch;

            let lev;
            if (sol.indexOf(SHARP) !== -1) {
                lev = 1;
            } else if (sol.indexOf(FLAT) !== -1) {
                lev = -1;
            } else if (sol.indexOf(DOUBLEFLAT) !== -1) {
                lev = -2;
            } else if (sol.indexOf(DOUBLESHARP) !== -1) {
                lev = 2;
            } else {
                lev = 0;
            }
            this.accidentalCenter = lev + 2;
            this.octaveCenter = this.sampleOctave;
        };

        /**
         * Calculates the frequency in Hz for the current pitch.
         * @returns {number} The frequency in Hz
         */
        this._calculateFrequency = function (edo) {
            const currentEDO = edo || 12;
            let semitones = 0;

            semitones += isNaN(this.octaveCenter) ? 0 : this.octaveCenter * currentEDO;
            semitones += isNaN(this.pitchCenter) ? 0 : MAJORSCALE[this.pitchCenter];
            semitones += isNaN(this.accidentalCenter) ? 0 : this.accidentalCenter - 2;

            // A4 = 440Hz at semitone position 57
            const netChange = semitones - 57;
            const frequency = Math.floor(440 * Math.pow(2, netChange / currentEDO));

            return frequency;
        };

        /**
         * Updates the sample pitch value based on the pitch, accidental, and octave centers.
         * @returns {void}
         */
        this._updateSamplePitchValues = function () {
            this.samplePitch =
                SOLFEGENAMES[this.pitchCenter] + EXPORTACCIDENTALNAMES[this.accidentalCenter];
            this.sampleOctave = this.octaveCenter.toString();
        };

        /**
         * Sets the timbre based on the current sample.
         * @returns {void}
         */
        this.setTimbre = function () {
            if (this.sampleName !== null && this.sampleName !== "") {
                this.originalSampleName = this.sampleName + "_original";
                const sampleArray = [this.originalSampleName, this.sampleData, "la", 4];
                Singer.ToneActions.setTimbre(sampleArray, 0, this.timbreBlock);
            }
        };

        /**
         * Gets the pitch name based on the current pitch, accidental, and octave.
         * Also updates the pitch button display.
         * @returns {string} The pitch name.
         */
        this.getPitchName = function () {
            let name = "";
            name = PITCHNAMES[this.pitchCenter];
            name += EXPORTACCIDENTALNAMES[this.accidentalCenter];
            name += this.octaveCenter.toString();
            this.pitchName = name;

            // Calculate frequency
            const frequency = this._calculateFrequency();

            // Update the pitch button value
            this.pitchBtn.value = this.pitchName;

            // Update the frequency display text
            this.frequencyDisplay.textContent = frequency + " Hz";

            return this.pitchName;
        };
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = SamplerPitch;
}
