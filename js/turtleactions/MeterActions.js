/**
 * @file This contains the action methods of the Turtle's Singer component's Meter blocks.
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
 * Sets up all the methods related to different actions for each block in Meter palette.
 *
 * @returns {void}
 */
function setupMeterActions() {
    Singer.MeterActions = class {
        /**
         * @param {Number} beatCount
         * @param {Number} noteValue
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {void}
         */
        static setMeter(beatCount, noteValue, turtle) {
            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.beatsPerMeasure = beatCount <= 0 ? 4 : beatCount;
            tur.singer.noteValuePerBeat = noteValue <= 0 ? 4 : 1 / noteValue;

            // setup default strong / weak beats until any strong beat block is used

            if (tur.singer.noteValuePerBeat == 4 && tur.singer.beatsPerMeasure == 4) {
                tur.singer.beatList.push(1);
                tur.singer.beatList.push(3);
                tur.singer.defaultStrongBeats = true;
            }
            else if (tur.singer.noteValuePerBeat == 4 && tur.singer.beatsPerMeasure == 2) {
                tur.singer.beatList.push(1);
                tur.singer.defaultStrongBeats = true;
            }
            else if (tur.singer.noteValuePerBeat == 4 && tur.singer.beatsPerMeasure == 3) {
                tur.singer.beatList.push(1);
                tur.singer.defaultStrongBeats = true;
            }
            else if (tur.singer.noteValuePerBeat == 8 && tur.singer.beatsPerMeasure == 6) {
                tur.singer.beatList.push(1);
                tur.singer.beatList.push(4);
                tur.singer.defaultStrongBeats = true;
            }

            logo.notation.notationMeter(
                turtle, tur.singer.beatsPerMeasure, tur.singer.noteValuePerBeat
            );
        }
    }
}
