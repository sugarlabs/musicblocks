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

/* exported IntervalsBlocksAPI */

/**
 * Class pertaining to the API methods specific to Intervals blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */
class IntervalsBlocksAPI {
    setKey(key, mode) {
        const args = JSInterface.validateArgs("setKey", [key, mode]);
        return this.runCommand("setKey", [args[0], args[1], this.turIndex]);
    }

    async defineMode(name, flow) {
        const args = JSInterface.validateArgs("defineMode", [name, flow]);
        await this.runCommand("defineMode", [args[0], this.turIndex, MusicBlocks.BLK]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async setScalarInterval(value, flow) {
        const args = JSInterface.validateArgs("setScalarInterval", [value, flow]);
        await this.runCommand("setScalarInterval", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async setSemitoneInterval(value, flow) {
        const args = JSInterface.validateArgs("setSemitoneInterval", [value, flow]);
        await this.runCommand("setSemitoneInterval", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    setTemperament(temperament, pitch, octave) {
        const args = JSInterface.validateArgs("setTemperament", [temperament, pitch, octave]);
        return this.runCommand("setTemperament", [args[0], args[1], args[2]]);
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntervalsBlocksAPI;
}
