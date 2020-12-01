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
        let args = JSInterface.validateArgs("setMeter", [beatCount, noteValue]);
        return this.runCommand("setMeter", [args[0], args[1], this.turIndex]);
    }

    setBPM(bpm, beatValue) {
        let args = JSInterface.validateArgs("setBPM", [bpm, beatValue]);
        return this.runCommand("setBPM", [args[0], args[1], this.turIndex]);
    }

    setMasterBPM(bpm, beatValue) {
        let args = JSInterface.validateArgs("setMasterBPM", [bpm, beatValue]);
        return this.runCommand("setMasterBPM", [args[0], args[1]]);
    }

    onEveryNoteDo(action) {
        let args = JSInterface.validateArgs("onEveryNoteDo", [action]);
        return this.runCommand("onEveryNoteDo", [args[0], null, null, this.turIndex]);
    }

    onEveryBeatDo(action) {
        let args = JSInterface.validateArgs("onEveryBeatDo", [action]);
        return this.runCommand("onEveryBeatDo", [args[0], null, null, this.turIndex]);
    }

    onStrongBeatDo(beat, action) {
        let args = JSInterface.validateArgs("onStrongBeatDo", [beat, action]);
        return this.runCommand("onStrongBeatDo", [args[0], args[1], null, null, this.turIndex]);
    }

    onWeakBeatDo(action) {
        let args = JSInterface.validateArgs("onWeakBeatDo", [action]);
        return this.runCommand("onWeakBeatDo", [args[0], null, null, this.turIndex]);
    }

    async setNoClock(flow) {
        let args = JSInterface.validateArgs("setNoClock", [flow]);
        await this.runCommand("setNoClock", [this.turIndex]);
        await args[0]();
        return this.ENDFLOWCOMMAND;
    }

    getNotesPlayed(noteValue) {
        let args = JSInterface.validateArgs("getNotesPlayed", [noteValue]);
        return Singer.MeterActions.getNotesPlayed(args[0], this.turIndex);
    }
}
