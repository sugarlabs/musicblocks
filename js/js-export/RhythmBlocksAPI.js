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
        await this.runCommand("playNote", [value, "newnote", this.turIndex, MusicBlocks.BLK]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    async playNoteMillis(value, flow) {
        await this.runCommand("playNote", [value, "osctime", this.turIndex, MusicBlocks.BLK]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    playRest() {
        return this.runCommand("playRest", [this.turIndex]);
    }

    async dot(value, flow) {
        await this.runCommand("doRhythmicDot", [value, this.turIndex, MusicBlocks.BLK]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    async tie(flow) {
        await this.runCommand("doTie", [this.turIndex, MusicBlocks.BLK]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    async multiplyNoteValue(factor, flow) {
        await this.runCommand("multiplyNoteValue", [factor, this.turIndex, MusicBlocks.BLK]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    async swing(swingValue, noteValue, flow) {
        await this.runCommand("addSwing", [swingValue, noteValue, this.turIndex, MusicBlocks.BLK]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }
}
