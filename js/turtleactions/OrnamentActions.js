/**
 * @file This contains the action methods of the Turtle's Singer component's Ornament blocks.
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
 * Sets up all the methods related to different actions for each block in Ornament palette.
 *
 * @returns {void}
 */
function setupOrnamentActions() {
    Singer.OrnamentActions = class {
        /**
         * Shortens the length of the actual note while maintaining the specified rhythmic value of the notes.
         *
         * @param {Number} value - staccato value
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} [blk] - corresponding Block index in blocks.blockList
         * @returns {void}
         */
        static setStaccato(value, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.staccato.push(1 / value);

            let listenerName = "_staccato_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => tur.singer.staccato.pop();

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Lengthens the sustain of notes while maintaining the specified rhythmic value of the notes.
         *
         * @param {Number} value - staccato value
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} [blk] - corresponding Block index in blocks.blockList
         * @returns {void}
         */
        static setSlur(value, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.staccato.push(-1 / value);

            if (tur.singer.justCounting.length === 0) {
                logo.notation.notationBeginSlur(turtle);
            }

            let listenerName = "_staccato_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                tur.singer.staccato.pop();
                if (tur.singer.justCounting.length === 0) {
                    logo.notation.notationEndSlur(turtle);
                }
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Rapidly switches between neighboring pitches.
         *
         * @param {Number} interval
         * @param {Number} noteValue
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} [blk] - corresponding Block index in blocks.blockList
         * @returns {void}
         */
        static doNeighbor(interval, noteValue, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.inNeighbor.push(blk);
            tur.singer.neighborStepPitch.push(interval);
            tur.singer.neighborNoteValue.push(noteValue);

            let listenerName = "_neighbor_" + turtle + "_" + blk;
            if (blk !== undefined && blk in logo.blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                tur.singer.inNeighbor.pop();
                tur.singer.neighborStepPitch.pop();
                tur.singer.neighborNoteValue.pop();
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }
    }
}
