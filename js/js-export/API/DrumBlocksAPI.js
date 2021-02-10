/**
 * @file This contains the API function defimitions for JavaScript based Music Blocks code specific
 * to Drum blocks.
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

/* global MusicBlocks, JSInterface */

/* exported DrumBlocksAPI */

/**
 * Class pertaining to the API methods specific to Drum blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */
class DrumBlocksAPI {
    playDrum(drum) {
        const args = JSInterface.validateArgs("playDrum", [drum]);
        return this.runCommand("playDrum", [args[0], this.turIndex, MusicBlocks.BLK]);
    }

    async setDrum(drum, flow) {
        const args = JSInterface.validateArgs("setDrum", [drum, flow]);
        await this.runCommand("setDrum", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async mapPitchToDrum(drum, flow) {
        const args = JSInterface.validateArgs("mapPitchToDrum", [drum, flow]);
        await this.runCommand("mapPitchToDrum", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    playNoise(noise) {
        const args = JSInterface.validateArgs("playNoise", [noise]);
        return this.runCommand("playNoise", [args[0], this.turIndex]);
    }
}
