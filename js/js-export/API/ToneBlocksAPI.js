/**
 * @file This contains the API function defimitions for JavaScript based Music Blocks code specific
 * to Tone blocks.
 * @author Anindya Kundu
 *
 * @copyright 2020 Anindya Kundu
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

/* global JSInterface, MusicBlocks */

/* exported ToneBlocksAPI */

/**
 * Class pertaining to the API methods specific to Tone blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */
class ToneBlocksAPI {
    /**
     * Sets the instrument/timbre for the current turtle.
     * @param {string} instrument - The name of the instrument to set
     * @param {Function} flow - Flow function to execute after setting the instrument
     * @returns {string} ENDFLOWCOMMAND
     */
    async setInstrument(instrument, flow) {
        const args = JSInterface.validateArgs("setInstrument", [instrument, flow]);
        await this.runCommand("setTimbre", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    /**
     * Applies a vibrato effect to the current turtle's sound.
     * @param {number} intensity - The intensity of the vibrato effect
     * @param {number} rate - The rate of the vibrato oscillation
     * @param {Function} flow - Flow function to execute after applying vibrato
     * @returns {string} ENDFLOWCOMMAND
     */
    async doVibrato(intensity, rate, flow) {
        const args = JSInterface.validateArgs("doVibrato", [intensity, rate, flow]);
        await this.runCommand("doVibrato", [args[0], args[1], this.turIndex]);
        await args[2]();
        return this.ENDFLOWCOMMAND;
    }

    /**
     * Applies a chorus effect to the current turtle's sound.
     * @param {number} chorusRate - The rate of the chorus effect
     * @param {number} delayTime - The delay time for the chorus
     * @param {number} chorusDepth - The depth of the chorus effect
     * @param {Function} flow - Flow function to execute after applying chorus
     * @returns {string} ENDFLOWCOMMAND
     */
    async doChorus(chorusRate, delayTime, chorusDepth, flow) {
        const args = JSInterface.validateArgs("doChorus", [
            chorusRate,
            delayTime,
            chorusDepth,
            flow
        ]);
        await this.runCommand("doChorus", [args[0], args[1], args[2], this.turIndex]);
        await args[3]();
        return this.ENDFLOWCOMMAND;
    }

    /**
     * Applies a phaser effect to the current turtle's sound.
     * @param {number} rate - The rate of the phaser effect
     * @param {number} octaves - Number of octaves the effect should span
     * @param {number} baseFrequency - The base frequency for the phaser
     * @param {Function} flow - Flow function to execute after applying phaser
     * @returns {string} ENDFLOWCOMMAND
     */
    async doPhaser(rate, octaves, baseFrequency, flow) {
        const args = JSInterface.validateArgs("doPhaser", [rate, octaves, baseFrequency, flow]);
        await this.runCommand("doPhaser", [args[0], args[1], args[2], this.turIndex]);
        await args[3]();
        return this.ENDFLOWCOMMAND;
    }

    /**
     * Applies a tremolo effect to the current turtle's sound.
     * @param {number} frequency - The frequency of the tremolo effect
     * @param {number} depth - The depth of the tremolo effect
     * @param {Function} flow - Flow function to execute after applying tremolo
     * @returns {string} ENDFLOWCOMMAND
     */
    async doTremolo(frequency, depth, flow) {
        const args = JSInterface.validateArgs("doTremolo", [frequency, depth, flow]);
        await this.runCommand("doTremolo", [args[0], args[1], this.turIndex]);
        await args[2]();
        return this.ENDFLOWCOMMAND;
    }

    /**
     * Applies a distortion effect to the current turtle's sound.
     * @param {number} distortion - The amount of distortion to apply (0-1)
     * @param {Function} flow - Flow function to execute after applying distortion
     * @returns {string} ENDFLOWCOMMAND
     */
    async doDistortion(distortion, flow) {
        const args = JSInterface.validateArgs("doDistortion", [distortion, flow]);
        await this.runCommand("doDistortion", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    /**
     * Applies a harmonic effect to the current turtle's sound.
     * @param {number} harmonic - The harmonic number to apply
     * @param {Function} flow - Flow function to execute after applying harmonic
     * @returns {string} ENDFLOWCOMMAND
     */
    async doHarmonic(harmonic, flow) {
        const args = JSInterface.validateArgs("doHarmonic", [harmonic, flow]);
        await this.runCommand("doHarmonic", [args[0], this.turIndex, MusicBlocks.BLK]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = ToneBlocksAPI;
}