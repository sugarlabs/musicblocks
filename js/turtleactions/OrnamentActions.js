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
         */
        static setStaccato(value, turtle) {
            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.staccato.push(1 / value);

            let listenerName = "_staccato_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => tur.singer.staccato.pop();

            logo.setTurtleListener(turtle, listenerName, __listener);
        }
    }
}
