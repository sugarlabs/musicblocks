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
    /**
     * Plays a note with specified pitch and octave.
     * @param {string} note - The note name to play (e.g., 'C', 'D', etc.)
     * @param {number} octave - The octave number for the note
     * @returns {Promise} Command execution promise
     */
    playPitch(note, octave) {
        const args = JSInterface.validateArgs("playPitch", [note, octave]);
        return this.runCommand("playPitch", [args[0], args[1], 0, this.turIndex, MusicBlocks.BLK]);
    }

    /**
     * Steps the pitch up or down by a specified value.
     * @param {number} value - The number of steps to move (positive for up, negative for down)
     * @returns {Promise} Command execution promise
     */
    stepPitch(value) {
        const args = JSInterface.validateArgs("stepPitch", [value]);
        return this.runCommand("stepPitch", [args[0], this.turIndex]);
    }

    /**
     * Plays the nth pitch in the current modal scale.
     * @param {number} number - The scale degree to play
     * @param {number} octave - The octave number
     * @returns {Promise} Command execution promise
     */
    playNthModalPitch(number, octave) {
        const args = JSInterface.validateArgs("playNthModalPitch", [number, octave]);
        return this.runCommand("playNthModalPitch", [
            args[0],
            args[1],
            this.turIndex,
            MusicBlocks.BLK
        ]);
    }

    /**
     * Plays a pitch specified by its number value.
     * @param {number} number - The pitch number to play
     * @returns {Promise} Command execution promise
     */
    playPitchNumber(number) {
        const args = JSInterface.validateArgs("playPitchNumber", [number]);
        return this.runCommand("playPitchNumber", [args[0], this.turIndex, MusicBlocks.BLK]);
    }

    /**
     * Plays a note at a specified frequency in Hertz.
     * @param {number} value - The frequency in Hertz
     * @returns {Promise} Command execution promise
     */
    playHertz(value) {
        const args = JSInterface.validateArgs("playHertz", [value]);
        return this.runCommand("playHertz", [args[0], this.turIndex]);
    }

    /**
     * Sets an accidental (sharp, flat, etc.) for subsequent notes.
     * @param {string} accidental - The accidental to apply
     * @param {Function} flow - Flow function to execute after setting accidental
     * @returns {string} ENDFLOWCOMMAND
     */
    async setAccidental(accidental, flow) {
        const args = JSInterface.validateArgs("setAccidental", [accidental, flow]);
        await this.runCommand("setAccidental", [args[0], this.turIndex, MusicBlocks.BLK]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    /**
     * Transposes subsequent notes by a scalar value.
     * @param {number} value - The number of scale degrees to transpose
     * @param {Function} flow - Flow function to execute after transposition
     * @returns {string} ENDFLOWCOMMAND
     */
    async setScalarTranspose(value, flow) {
        const args = JSInterface.validateArgs("setScalarTranspose", [value, flow]);
        await this.runCommand("setScalarTranspose", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    /**
     * Transposes subsequent notes by a specified number of semitones.
     * @param {number} value - The number of semitones to transpose
     * @param {Function} flow - Flow function to execute after transposition
     * @returns {string} ENDFLOWCOMMAND
     */
    async setSemitoneTranspose(value, flow) {
        const args = JSInterface.validateArgs("setSemitoneTranspose", [value, flow]);
        await this.runCommand("setSemitoneTranspose", [args[0], this.turIndex]);
        await args[1]();
        return this.ENDFLOWCOMMAND;
    }

    /**
     * Sets the register (octave range) for subsequent notes.
     * @param {number} value - The register value to set
     * @returns {Promise} Command execution promise
     */
    setRegister(value) {
        const args = JSInterface.validateArgs("setRegister", [value]);
        return this.runCommand("setRegister", [args[0], this.turIndex]);
    }

    /**
     * Inverts the current pitch sequence based on specified parameters.
     * @param {string} name - The name of the inversion
     * @param {number} octave - The octave for the inversion
     * @param {string} mode - The mode for the inversion
     * @param {Function} flow - Flow function to execute after inversion
     * @returns {string} ENDFLOWCOMMAND
     */
    async invert(name, octave, mode, flow) {
        const args = JSInterface.validateArgs("invert", [name, octave, mode, flow]);
        await this.runCommand("invert", [args[0], args[1], args[2], this.turIndex]);
        await args[3]();
        return this.ENDFLOWCOMMAND;
    }

    /**
     * Sets the pitch number offset for subsequent notes.
     * @param {number} pitch - The pitch offset value
     * @param {number} octave - The octave offset value
     * @returns {Promise} Command execution promise
     */
    setPitchNumberOffset(pitch, octave) {
        const args = JSInterface.validateArgs("setPitchNumberOffset", [pitch, octave]);
        return this.runCommand("setPitchNumberOffset", [args[0], args[1], this.turIndex]);
    }

    /**
     * Converts a number to its corresponding pitch name.
     * @param {number} number - The number to convert
     * @returns {string} The pitch name
     */
    numToPitch(number) {
        const args = JSInterface.validateArgs("numToPitch", [number]);
        return Singer.PitchActions.numToPitch(args[0], "pitch", this.turIndex);
    }

    /**
     * Converts a number to its corresponding octave.
     * @param {number} number - The number to convert
     * @returns {number} The octave number
     */
    numToOctave(number) {
        const args = JSInterface.validateArgs("numToOctave", [number]);
        return Singer.PitchActions.numToPitch(args[0], "octave", this.turIndex);
    }
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = PitchBlocksAPI;
}
