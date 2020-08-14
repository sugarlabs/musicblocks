/**
 * @file This contains the action methods of the Turtle's Singer component's Intervals blocks.
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
 * Sets up all the methods related to different actions for each block in Intervals palette.
 *
 * @returns {void}
 */
function setupIntervalsActions() {
    Singer.IntervalsActions = class {
        static GetModename(mode) {
            let modename = "major";
            for (let _mode in MUSICALMODES) {
                if (_mode === mode || _(_mode) === mode) {
                    modename = _mode;
                    break;
                }
            }

            return modename;
        }

        static setKey(key, mode, turtle) {
            let modename = Singer.IntervalsActions.GetModename(mode);

            let tur = logo.turtles.ithTurtle(turtle);
            // Check to see if there are any transpositions on the key
            if (tur.singer.transposition !== 0) {
                let noteObj = getNote(
                    key,
                    4,
                    tur.singer.transposition,
                    tur.singer.keySignature,
                    false,
                    null,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );
                tur.singer.keySignature = noteObj[0] + " " + modename;
                logo.notation.notationKey(turtle, noteObj[0], modename);
            } else {
                tur.singer.keySignature = key + " " + modename;
                logo.notation.notationKey(turtle, key, modename);
            }
        }
    }
}
