/**
 * @file This contains the API function defimitions for JavaScript based Music Blocks code specific
 * to Volume blocks.
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
 * Class pertaining to the API methods specific to Volume blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */
class VolumeBlocksAPI {
    async doCrescendo(value, flow) {
        const args = JSInterface.validateArgs("doCrescendo", [value, flow]);
        await this.runCommand("doCrescendo", ["crescendo", args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async doDecrescendo(value, flow) {
        const args = JSInterface.validateArgs("doDecrescendo", [value, flow]);
        await this.runCommand("doCrescendo", ["decrescendo", args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async setRelativeVolume(value, flow) {
        const args = JSInterface.validateArgs("setRelativeVolume", [value, flow]);
        await this.runCommand("setRelativeVolume", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    setSynthVolume(synth, volume) {
        const args = JSInterface.validateArgs("setSynthVolume", [synth, volume]);
        return this.runCommand("setSynthVolume", [args[0], args[1], this.turIndex]);
    }

    getSynthVolume(synth) {
        const args = JSInterface.validateArgs("getSynthVolume", [synth]);
        return Singer.VolumeActions.getSynthVolume(args[0], this.turIndex);
    }
}
