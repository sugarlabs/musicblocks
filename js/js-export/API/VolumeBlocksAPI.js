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


/* global JSInterface, Singer */

/* exported VolumeBlocksAPI */

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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VolumeBlocksAPI;
}