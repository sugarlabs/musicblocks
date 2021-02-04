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

/**
 * Class pertaining to the API methods specific to Tone blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */

/*global JSInterface, MusicBlocks*/
/* exported ToneBlocksAPI*/
class ToneBlocksAPI {
    async setInstrument(instrument, flow) {
        const args = JSInterface.validateArgs("setInstrument", [instrument, flow]);
        await this.runCommand("setTimbre", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async doVibrato(intensity, rate, flow) {
        const args = JSInterface.validateArgs("doVibrato", [intensity, rate, flow]);
        await this.runCommand("doVibrato", [args[0], args[1], this.turIndex]);
        await args[2]();
        return this.ENDFLOWCOMMAND;
    }

    async doChorus(chorusRate, delayTime, chorusDepth, flow) {
        const args = JSInterface.validateArgs("doChorus", [chorusRate, delayTime, chorusDepth, flow]);
        await this.runCommand("doChorus", [args[0], args[1], args[2], this.turIndex]);
        await args[3]();
        return this.ENDFLOWCOMMAND;
    }

    async doPhaser(rate, octaves, baseFrequency, flow) {
        const args = JSInterface.validateArgs("doPhaser", [rate, octaves, baseFrequency, flow]);
        await this.runCommand("doPhaser", [args[0], args[1], args[2], this.turIndex]);
        await args[3]();
        return this.ENDFLOWCOMMAND;
    }

    async doTremolo(frequency, depth, flow) {
        const args = JSInterface.validateArgs("doTremolo", [frequency, depth, flow]);
        await this.runCommand("doTremolo", [args[0], args[1], this.turIndex]);
        await args[2]();
        return this.ENDFLOWCOMMAND;
    }

    async doDistortion(distortion, flow) {
        const args = JSInterface.validateArgs("doDistortion", [distortion, flow]);
        await this.runCommand("doDistortion", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async doHarmonic(harmonic, flow) {
        const args = JSInterface.validateArgs("doHarmonic", [harmonic, flow]);
        await this.runCommand("doHarmonic", [args[0], this.turIndex, MusicBlocks.BLK]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }
}
