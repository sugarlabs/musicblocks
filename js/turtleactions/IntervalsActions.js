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

        static getCurrentKey(turtle) {
            return logo.turtles.ithTurtle(turtle).singer.keySignature.split(' ')[0];
        }

        static getCurrentMode(turtle) {
            return logo.turtles.ithTurtle(turtle).singer.keySignature.split(' ')[1];
        }

        static getModeLength(turtle) {
            return getModeLength(logo.turtles.ithTurtle(turtle).singer.keySignature);
        }

        static setMoveableDo(moveable, turtle) {
            logo.turtles.ithTurtle(turtle).singer.moveable = moveable;
        }

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
            if (blk !== undefined && blk in blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

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
    }
}
