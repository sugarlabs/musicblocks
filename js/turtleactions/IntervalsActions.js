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
 *
 * Utility methods are in PascalCase.
 * Action methods are in camelCase.
*/

/**
 * Sets up all the methods related to different actions for each block in Intervals palette.
 *
 * @returns {void}
 */
function setupIntervalsActions() {
    Singer.IntervalsActions = class {
        /**
         * Utility function that returns appropriate object key in MUSICMODES corresponding to passed parameter.
         *
         * @static
         * @param {String} mode
         * @returns {String}
         */
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

        /**
         * "set key" block.
         * Sets the key and mode.
         *
         * @static
         * @param {String} key
         * @param {String} mode
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {void}
         */
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

        /**
         * "current key" block.
         * Returns current key.
         *
         * @static
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {String}
         */
        static getCurrentKey(turtle) {
            return logo.turtles.ithTurtle(turtle).singer.keySignature.split(' ')[0];
        }

        /**
         * "current mode" block.
         * Returns current mode.
         *
         * @static
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {String}
         */
        static getCurrentMode(turtle) {
            return logo.turtles.ithTurtle(turtle).singer.keySignature.split(' ')[1];
        }

        /**
         * "mode length" block.
         * Returns current mode length.
         *
         * @static
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {Number}
         */
        static getModeLength(turtle) {
            return getModeLength(logo.turtles.ithTurtle(turtle).singer.keySignature);
        }

        /**
         * "moveable do" block.
         * Attaches or detaches solfege names to specific pitches.
         *
         * @static
         * @param {Boolean} moveable - whether solfeges are fixed or moveable
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {void}
         */
        static setMoveableDo(moveable, turtle) {
            logo.turtles.ithTurtle(turtle).singer.moveable = moveable;
        }

        /**
         * "define mode" block.
         * Defines a custom mode by specifiying pitch numbers.
         *
         * @static
         * @param {String} name - custom mode name
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number|String} [blk] - corresponding Block index in blocks.blockList
         * @returns {void}
         */
        static defineMode(name, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.inDefineMode = true;
            tur.singer.defineMode = [];
            let modeName;
            if (name === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                modeName = "custom";
            } else {
                modeName = args[0].toLowerCase();
            }

            let listenerName = "_definemode_" + turtle;
            if (blk !== undefined && blk in blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                let mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null)
                    mouse.MB.listeners.push(listenerName);
            }

            let __listener = event => {
                MUSICALMODES[modeName] = [];
                if (tur.singer.defineMode.indexOf(0) === -1) {
                    tur.singer.defineMode.push(0);
                    logo.errorMsg(_("Adding missing pitch number 0."));
                }

                let pitchNumbers = tur.singer.defineMode.sort((a, b) => a[0] - b[0]);

                for (let i = 0; i < pitchNumbers.length; i++) {
                    if (pitchNumbers[i] < 0 || pitchNumbers[i] > 11) {
                        logo.errorMsg(
                            _("Ignoring pitch numbers less than zero or greater than eleven.")
                        );
                        continue;
                    }

                    if (i > 0 && pitchNumbers[i] === pitchNumbers[i - 1]) {
                        logo.errorMsg(_("Ignoring duplicate pitch numbers."));
                        continue;
                    }

                    if (i < pitchNumbers.length - 1) {
                        MUSICALMODES[modeName].push(pitchNumbers[i + 1] - pitchNumbers[i]);
                    } else {
                        MUSICALMODES[modeName].push(12 - pitchNumbers[i]);
                    }
                }

                let cblk = logo.blocks.blockList[blk].connections[1];
                if (logo.blocks.blockList[cblk].name === "modename") {
                    logo.blocks.updateBlockText(cblk);
                }

                tur.singer.inDefineMode = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * "scalar interval" block.
         * Calculates a relative interval based on the current mode, skipping all notes outside of
         * the mode for the notes with it.
         *
         * @static
         * @param {Number} value - interval value
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number|String} [blk] - corresponding Block index in blocks.blockList
         * @returns {void}
         */
        static setScalarInterval(value, turtle, blk) {
            let arg = value;
            if (arg === null || typeof arg !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1;
            }

            let tur = logo.turtles.ithTurtle(turtle);

            let i = arg > 0 ? Math.floor(arg) : Math.ceil(arg);
            tur.singer.intervals.push(i);

            let listenerName = "_interval_" + turtle;
            if (blk !== undefined && blk in blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                let mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null)
                    mouse.MB.listeners.push(listenerName);
            }

            let __listener = event => tur.singer.intervals.pop();

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * "semi-tone interval" block.
         * Calculates a relative interval of half-steps for the notes with it.
         *
         * @static
         * @param {Number} value - interval value
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number|String} [blk] - corresponding Block index in blocks.blockList
         * @returns {void}
         */
        static setSemitoneInterval(value, turtle, blk) {
            let arg = value;
            if (arg === null || typeof arg !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1;
            }

            let tur = logo.turtles.ithTurtle(turtle);

            let i = arg > 0 ? Math.floor(arg) : Math.ceil(arg);
            if (i !== 0) {
                tur.singer.semitoneIntervals.push([i, tur.singer.noteDirection]);
                tur.singer.noteDirection = 0;

                let listenerName = "_semitone_interval_" + turtle;
                if (blk !== undefined && blk in blocks.blockList) {
                    logo.setDispatchBlock(blk, turtle, listenerName);
                } else if (MusicBlocks.isRun) {
                    let mouse = Mouse.getMouseFromTurtle(tur);
                    if (mouse !== null)
                        mouse.MB.listeners.push(listenerName);
                }

                let __listener = () => tur.singer.semitoneIntervals.pop();

                logo.setTurtleListener(turtle, listenerName, __listener);
            }
        }

        /**
         * "temperament" block.
         * Sets the tuning system used by Music Blocks.
         *
         * @static
         * @param {String} temperament
         * @param {String} pitch
         * @param {Number} octave
         * @returns {void}
         */
        static setTemperament(temperament, pitch, octave) {
            logo.synth.inTemperament = temperament;
            logo.synth.startingPitch = pitch + "" + octave;

            logo.temperamentSelected.push(temperament);
            let len = logo.temperamentSelected.length;

            if (logo.temperamentSelected[len - 1] !== logo.temperamentSelected[len - 2]) {
                logo.synth.changeInTemperament = true;
            }
        }
    }
}
