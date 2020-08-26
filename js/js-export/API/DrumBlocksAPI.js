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

/**
 * Class pertaining to the API methods specific to Drum blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */
class DrumBlocksAPI {
    playDrum(drum) {
        return this.runCommand("playDrum", [drum, this.turIndex, MusicBlocks.BLK]);
    }

    async setDrum(drum, flow) {
        await this.runCommand("setDrum", [drum, this.turIndex]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    async mapPitchToDrum(drum, flow) {
        await this.runCommand("mapPitchToDrum", [drum, this.turIndex]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    playNoise(noise) {
        return this.runCommand("playNoise", [noise, this.turIndex]);
    }
}
