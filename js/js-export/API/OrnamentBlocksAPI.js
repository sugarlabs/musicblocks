/**
 * @file This contains the API function defimitions for JavaScript based Music Blocks code specific
 * to Ornament blocks.
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
 * Class pertaining to the API methods specific to Ornament blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */
class OrnamentBlocksAPI {
    async setStaccato(value, flow) {
        const args = JSInterface.validateArgs("setStaccato", [value, flow]);
        await this.runCommand("setStaccato", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async setSlur(value, flow) {
        const args = JSInterface.validateArgs("setSlur", [value, flow]);
        await this.runCommand("setSlur", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async doNeighbor(interval, noteValue, flow) {
        const args = JSInterface.validateArgs("doNeighbor", [interval, noteValue, flow]);
        await this.runCommand("doNeighbor", [args[0], args[1], this.turIndex, MusicBlocks.BLK]);
        await args[2]();
        return this.ENDFLOWCOMMAND;
    }
}
