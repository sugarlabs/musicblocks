/*
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Sugar Labs
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/* global JSInterface, MusicBlocks */

/* exported OrnamentBlocksAPI */

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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrnamentBlocksAPI;
}