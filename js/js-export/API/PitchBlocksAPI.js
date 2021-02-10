/**
 * @file This contains the API function defimitions for JavaScript based Music Blocks code specific
 * to Pitch blocks.
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

/* global JSInterface, MusicBlocks, Singer */

/* exported PitchBlocksAPI */

/**
 * Class pertaining to the API methods specific to Pitch blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */
class PitchBlocksAPI {
    playPitch(note, octave) {
        const args = JSInterface.validateArgs("playPitch", [note, octave]);
        return this.runCommand("playPitch", [args[0], args[1], 0, this.turIndex, MusicBlocks.BLK]);
    }

    stepPitch(value) {
        const args = JSInterface.validateArgs("stepPitch", [value]);
        return this.runCommand("stepPitch", [args[0], this.turIndex]);
    }

    playNthModalPitch(number, octave) {
        const args = JSInterface.validateArgs("playNthModalPitch", [number, octave]);
        return this.runCommand("playNthModalPitch", [
            args[0],
            args[1],
            this.turIndex,
            MusicBlocks.BLK
        ]);
    }

    playPitchNumber(number) {
        const args = JSInterface.validateArgs("playPitchNumber", [number]);
        return this.runCommand("playPitchNumber", [args[0], this.turIndex, MusicBlocks.BLK]);
    }

    playHertz(value) {
        const args = JSInterface.validateArgs("playHertz", [value]);
        return this.runCommand("playHertz", [args[0], this.turIndex]);
    }

    async setAccidental(accidental, flow) {
        const args = JSInterface.validateArgs("setAccidental", [accidental, flow]);
        await this.runCommand("setAccidental", [args[0], this.turIndex, MusicBlocks.BLK]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async setScalarTranspose(value, flow) {
        const args = JSInterface.validateArgs("setScalarTranspose", [value, flow]);
        await this.runCommand("setScalarTranspose", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    async setSemitoneTranspose(value, flow) {
        const args = JSInterface.validateArgs("setSemitoneTranspose", [value, flow]);
        await this.runCommand("setSemitoneTranspose", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    setRegister(value) {
        const args = JSInterface.validateArgs("setRegister", [value]);
        return this.runCommand("setRegister", [args[0], this.turIndex]);
    }

    async invert(name, octave, mode, flow) {
        const args = JSInterface.validateArgs("invert", [name, octave, mode, flow]);
        await this.runCommand("invert", [args[0], args[1], args[2], this.turIndex]);
        await args[3]();
        return this.ENDFLOWCOMMAND;
    }

    setPitchNumberOffset(pitch, octave) {
        const args = JSInterface.validateArgs("setPitchNumberOffset", [pitch, octave]);
        return this.runCommand("setPitchNumberOffset", [args[0], args[1], this.turIndex]);
    }

    numToPitch(number) {
        const args = JSInterface.validateArgs("numToPitch", [number]);
        return Singer.PitchActions.numToPitch(args[0], "pitch", this.turIndex);
    }

    numToOctave(number) {
        const args = JSInterface.validateArgs("numToOctave", [number]);
        return Singer.PitchActions.numToPitch(args[0], "octave", this.turIndex);
    }

    // getPitchInfo(type) {
    //     let args = JSInterface.validateArgs("getPitchInfo", [type]);
    //     return Singer.PitchActions.getPitchInfo(args[0], this.turIndex);
    // }
}
