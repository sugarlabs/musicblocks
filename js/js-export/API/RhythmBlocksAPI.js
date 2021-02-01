/**
 * @file This contains the API function defimitions for JavaScript based Music Blocks code specific
 * to Rhythm blocks.
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
 * Class pertaining to the API methods specific to Rhythm blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */
class RhythmBlocksAPI {
    async playNote(value, flow) {
        const args = JSInterface.validateArgs("playNote", [value, flow]);
        await this.runCommand("playNote", [args[0], "newnote", this.turIndex, MusicBlocks.BLK]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async playNoteMillis(value, flow) {
        const args = JSInterface.validateArgs("playNoteMillis", [value, flow]);
        await this.runCommand("playNote", [args[0], "osctime", this.turIndex, MusicBlocks.BLK]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    playRest() {
        return this.runCommand("playRest", [this.turIndex]);
    }

    async dot(value, flow) {
        const args = JSInterface.validateArgs("dot", [value, flow]);
        await this.runCommand("doRhythmicDot", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async tie(flow) {
        const args = JSInterface.validateArgs("tie", [flow]);
        await this.runCommand("doTie", [this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async multiplyNoteValue(factor, flow) {
        const args = JSInterface.validateArgs("multiplyNoteValue", [factor, flow]);
        await this.runCommand("multiplyNoteValue", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async swing(swingValue, noteValue, flow) {
        const args = JSInterface.validateArgs("multiplyNoteValue", [swingValue, noteValue, flow]);
        await this.runCommand("addSwing", [args[0], args[1], this.turIndex]);
        await args[2]();
        return this.ENDFLOWCOMMAND;
    }
}
