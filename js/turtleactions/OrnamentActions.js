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

/* global Singer, logo, MusicBlocks, blocks, Mouse */

/*
   Global Locations
    js/turtle-singer.js
        Singer
    js/activity.js
        logo, blocks
    js/js-export/export.js
        MusicBlocks, Mouse
*/

/* exported setupOrnamentActions */

/**
 * Sets up all the methods related to different actions for each block in Ornament palette.
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
            const tur = logo.turtles.ithTurtle(turtle);

            tur.singer.staccato.push(1 / value);

            const listenerName = "_staccato_" + turtle;
            if (blk !== undefined && blk in blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => tur.singer.staccato.pop();

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
            const tur = logo.turtles.ithTurtle(turtle);

            tur.singer.staccato.push(-1 / value);

            if (tur.singer.justCounting.length === 0) {
                logo.notation.notationBeginSlur(turtle);
            }

            const listenerName = "_staccato_" + turtle;
            if (blk !== undefined && blk in blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
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
            const tur = logo.turtles.ithTurtle(turtle);

            tur.singer.inNeighbor.push(blk);
            tur.singer.neighborStepPitch.push(interval);
            tur.singer.neighborNoteValue.push(noteValue);

            const listenerName = "_neighbor_" + turtle + "_" + blk;
            if (blk !== undefined && blk in blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                tur.singer.inNeighbor.pop();
                tur.singer.neighborStepPitch.pop();
                tur.singer.neighborNoteValue.pop();
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }
    };
}
