/**
 * @file This contains the API function defimitions for JavaScript based Music Blocks code specific
 * to Meter blocks.
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
 * Class pertaining to the API methods specific to Meter blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */
class MeterBlocksAPI {
    setMeter(beatCount, noteValue) {
        return this.runCommand("setMeter", [beatCount, noteValue, this.turIndex]);
    }

    setPickup(value) {
        return this.runCommand("setPickup", [value, this.turIndex]);
    }

    setBPM(bpm, beatValue) {
        return this.runCommand("setBPM", [bpm, beatValue, this.turIndex]);
    }

    setMasterBPM(bpm, beatValue) {
        return this.runCommand("setMasterBPM", [bpm, beatValue]);
    }

    onEveryNoteDo(action) {
        return this.runCommand("onEveryNoteDo", [action, null, null, this.turIndex]);
    }

    onEveryBeatDo(action) {
        return this.runCommand("onEveryBeatDo", [action, null, null, this.turIndex]);
    }

    onStrongBeatDo(beat, action) {
        return this.runCommand("onStrongBeatDo", [beat, action, null, null, this.turIndex]);
    }

    onWeakBeatDo(action) {
        return this.runCommand("onWeakBeatDo", [action, null, null, this.turIndex]);
    }

    async setNoClock(flow) {
        await this.runCommand("setNoClock", [this.turIndex]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    getNotesPlayed(noteValue) {
        return Singer.MeterActions.getNotesPlayed(noteValue, this.turIndex);
    }
}
