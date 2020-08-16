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

/**
 * Class pertaining to the API methods specific to Pitch blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */
class PitchBlocksAPI {
    playPitch(note, octave) {
        return this.runCommand("playPitch", [note, octave, 0, this.turIndex, MusicBlocks.BLK]);
    }

    stepPitch(value) {
        return this.runCommand("stepPitch", [value, this.turIndex, MusicBlocks.BLK]);
    }

    playNthModalPitch(number, octave) {
        return this.runCommand(
            "playNthModalPitch", [number, octave, this.turIndex, MusicBlocks.BLK]
        );
    }

    playPitchNumber(number) {
        return this.runCommand("playPitchNumber", [number, this.turIndex, MusicBlocks.BLK]);
    }

    playHertz(value) {
        return this.runCommand("playHertz", [value, this.turIndex]);
    }

    async setAccidental(accidental, flow) {
        await this.runCommand("setAccidental", [accidental, this.turIndex, MusicBlocks.BLK]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    async setScalarTranspose(value, flow) {
        await this.runCommand("setScalarTranspose", [value, this.turIndex, MusicBlocks.BLK]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    async setSemitoneTranspose(value, flow) {
        await this.runCommand("setSemitoneTranspose", [value, this.turIndex, MusicBlocks.BLK]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    setRegister(value) {
        return this.runCommand("setRegister", [value, this.turIndex]);
    }

    async invert(name, octave, mode, flow) {
        await this.runCommand("invert", [name, octave, mode, this.turIndex, MusicBlocks.BLK]);
        await flow();
        return this.ENDFLOWCOMMAND;
    }

    numToPitch(number, outType) {
        return this.runCommand("numToPitch", [number, outType, this.turIndex]);
    }

    setPitchNumberOffset(pitch, octave) {
        return this.runCommand("setPitchNumberOffset", [pitch, octave, this.turIndex]);
    }

    getPitchInfo(type) {
        return this.runCommand("getPitchInfo", [type, this.turIndex]);
    }

    deltaPitch(outType) {
        return this.runCommand("deltaPitch", [outType, this.turIndex]);
    }

    consonantStepSize(type) {
        return this.runCommand("constantStepSize", [type, this.turIndex]);
    }
}
