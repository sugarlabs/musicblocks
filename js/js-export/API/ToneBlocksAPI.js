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
class ToneBlocksAPI {
    async setInstrument(instrument, flow) {
        await this.runCommand("setTimbre", [instrument, this.turIndex]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    async doVibrato(intensity, rate, flow) {
        await this.runCommand("doVibrato", [intensity, rate, this.turIndex]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    async doChorus(chorusRate, delayTime, chorusDepth, flow) {
        await this.runCommand("doChorus", [chorusRate, delayTime, chorusDepth, this.turIndex]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    async doPhaser(rate, octaves, baseFrequency, flow) {
        await this.runCommand("doPhaser", [rate, octaves, baseFrequency, this.turIndex]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    async doTremolo(frequency, depth, flow) {
        await this.runCommand("doTremolo", [frequency, depth, this.turIndex]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    async doDistortion(distortion, flow) {
        await this.runCommand("doDistortion", [distortion, this.turIndex]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    async doHarmonic(harmonic, flow) {
        await this.runCommand("doHarmonic", [harmonic, this.turIndex, MusicBlocks.BLK]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }
}
