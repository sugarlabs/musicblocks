/**
 * @file This contains the action methods of the Turtle's Singer component's Volume blocks.
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
 * Sets up all the methods related to different actions for each block in Volume palette.
 *
 * @returns {void}
 */
function setupVolumeActions() {
    Singer.VolumeActions = class {
        /**
         * Increases/decreases the volume of the contained notes by a specified amount for every note played.
         *
         * @param {String} type - crescendo or decrescendo
         * @param {Number} value - crescendo/decrescendo value
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} [blk] - corresponding Block index in blocks.blockList
         * @returns {void}
         */
        static doCrescendo(type, value, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.crescendoDelta.push(type === "crescendo" ? value : -value);

            for (let synth in tur.singer.synthVolume) {
                let vol = last(tur.singer.synthVolume[synth]);
                tur.singer.synthVolume[synth].push(vol);
                if (tur.singer.crescendoInitialVolume[synth] === undefined) {
                    tur.singer.crescendoInitialVolume[synth] = [vol];
                } else {
                    tur.singer.crescendoInitialVolume[synth].push(vol);
                }
            }

            tur.singer.inCrescendo.push(true);

            let listenerName = "_crescendo_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                if (tur.singer.justCounting.length === 0) {
                    logo.notation.notationEndCrescendo(turtle, last(tur.singer.crescendoDelta));
                }

                tur.singer.crescendoDelta.pop();
                for (let synth in tur.singer.synthVolume) {
                    let len = tur.singer.synthVolume[synth].length;
                    tur.singer.synthVolume[synth][len - 1] = last(
                        tur.singer.crescendoInitialVolume[synth]
                    );
                    tur.singer.crescendoInitialVolume[synth].pop();
                }
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Changes the volume of the contained notes.
         *
         * @param {Number} volume
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} [blk] - corresponding Block index in blocks.blockList
         * @returns {void}
         */
        static setRelativeVolume(volume, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            for (let synth in tur.singer.synthVolume) {
                let newVolume = (last(tur.singer.synthVolume[synth]) * (100 + volume)) / 100;
                newVolume = Math.max(Math.min(newVolume, 100), -100);

                if (tur.singer.synthVolume[synth] === undefined) {
                    tur.singer.synthVolume[synth] = [newVolume];
                } else {
                    tur.singer.synthVolume[synth].push(newVolume);
                }

                if (!tur.singer.suppressOutput) {
                    Singer.setSynthVolume(logo, turtle, synth, newVolume);
                }
            }

            if (tur.singer.justCounting.length === 0) {
                logo.notation.notationBeginArticulation(turtle);
            }

            let listenerName = "_articulation_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                for (let synth in tur.singer.synthVolume) {
                    tur.singer.synthVolume[synth].pop();
                    Singer.setSynthVolume(logo, turtle, synth, last(tur.singer.synthVolume[synth]));
                }

                if (tur.singer.justCounting.length === 0) {
                    logo.notation.notationEndArticulation(turtle);
                }
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Sets the volume for all synthesizers.
         *
         * @param {Number} volume
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} [blk] - corresponding Block index in blocks.blockList
         * @returns {void}
         */
        static setMasterVolume(volume, turtle, blk) {
            volume = Math.max(Math.min(volume, 100), 0);

            if (arg === 0)
                logo.errorMsg(_("Setting volume to 0."), blk);

            Singer.masterVolume.push(arg);

            let tur = logo.turtles.ithTurtle(turtle);
            if (!tur.singer.suppressOutput) {
                Singer.setMasterVolume(logo, arg);
            }
        }
    }
}
