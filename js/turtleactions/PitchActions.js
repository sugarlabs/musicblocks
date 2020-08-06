/**
 * @file This contains the action methods of the Turtle's Singer component's Pitch blocks.
 * @author Anindya Kundu
 * @author Walter Bender
 *
 * @copyright 2014-2020 Walter Bender
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
 * Sets up all the methods related to different actions for each block in Pitch palette.
 *
 * @returns {void}
 */
function setupPitchActions() {
    Singer.PitchActions = class {
        /**
         * Processes (and/or plays) a pitch.
         *
         * @param {String} notenote - note value or solfege
         * @param {Number} octave - scale octave
         * @param {Number} cents - semitone offset due to accidentals
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number|String} blk - corresponding Block object index in blocks.blockList or custom blockName
         */
        static playPitch(note, octave, cents, turtle, blk) {
            return Singer.processPitch(note, octave, cents, turtle, blk);
        }

        /**
         * Processes a pitch number block.
         *
         * @param {Number} pitchNumber - pitch number
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number|String} blk - corresponding Block object index in blocks.blockList or custom blockName
         */
        static playPitchNumber(pitchNumber, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.inDefineMode) {
                tur.singer.defineMode.push(pitchNumber);
                return;
            } else {
                if (
                    isCustom(logo.synth.inTemperament) &&
                    tur.singer.scalarTransposition + tur.singer.transposition !== 0
                ) {
                    logo.errorMsg(
                        _(
                            "Scalar transpositions are equal to Semitone transpositions for custom temperament."
                        )
                    );
                }

                // In number to pitch we assume A0 == 0, so add offset
                let obj = numberToPitch(
                    pitchNumber + tur.singer.pitchNumberOffset,
                    logo.synth.inTemperament,
                    logo.synth.startingPitch,
                    tur.singer.pitchNumberOffset
                );

                return Singer.processPitch(obj[0], obj[1], 0, turtle, blk);
            }
        }
    }
}
