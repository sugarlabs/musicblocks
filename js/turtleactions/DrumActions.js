/**
 * @file This contains the action methods of the Turtle's Singer component's Drum blocks.
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

/*
   global Singer, DEFAULTDRUM, DRUMNAMES, last, DEFAULTVOLUME, logo, blocks, MusicBlocks, Mouse,
   NOISENAMES, _
*/

/*
   Global Locations
    js/utils/utils.js
        _
    js/turtle-singer.js
        Singer
    js/activity.js
        logo, blocks
    js/utils/synthutils.js
        DRUMNAMES, NOISENAMES
    js/utils/musicutils.js
        DEFAULTDRUM
    js/logo.js/
        DEFAULTVOLUME
    js/js-export/export.js
        MusicBlocks, Mouse
*/

/* exported setupDrumActions */

/**
 * Sets up all the methods related to different actions for each block in Drum palette.
 * @returns {void}
 */
function setupDrumActions() {
    Singer.DrumActions = class {
        /**
         * Utility function that returns appropriate object key in DRUMNAMES corresponding to passed parameter.
         *
         * @static
         * @param {String} drum
         * @returns {String}
         */
        static GetDrumname(drum) {
            let drumname = DEFAULTDRUM;
            if (drum.slice(0, 4) === "http") {
                drumname = drum;
            } else {
                for (const d in DRUMNAMES) {
                    if (DRUMNAMES[d][0] === drum) {
                        drumname = DRUMNAMES[d][1];
                        break;
                    } else if (DRUMNAMES[d][1] === drum) {
                        drumname = drum;
                        break;
                    }
                }
            }
            return drumname;
        }

        /**
         * Plays a drum sound.
         *
         * @param {String} drum - drum name
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block object in blocks.blockList
         */
        static playDrum(drum, turtle, blk) {
            let drumname = Singer.DrumActions.GetDrumname(drum);

            const tur = logo.turtles.ithTurtle(turtle);

            // If we are in a setdrum clamp, override the drum name
            if (tur.singer.drumStyle.length > 0) {
                drumname = last(tur.singer.drumStyle);
            }

            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.noteDrums[last(tur.singer.inNoteBlock)].push(drumname);
                if (tur.singer.synthVolume[drumname] === undefined) {
                    tur.singer.synthVolume[drumname] = [DEFAULTVOLUME];
                    tur.singer.crescendoInitialVolume[drumname] = [DEFAULTVOLUME];
                }
            } else {
                // Play a stand-alone drum block as a quarter note.
                logo.clearNoteParams(tur, blk, []);
                tur.singer.inNoteBlock.push(blk);
                tur.singer.noteDrums[last(tur.singer.inNoteBlock)].push(drumname);

                const noteBeatValue = 4;

                const __callback = () =>
                    tur.singer.inNoteBlock.splice(tur.singer.inNoteBlock.indexOf(blk), 1);

                Singer.processNote(noteBeatValue, false, blk, turtle, __callback);
            }

            tur.singer.pushedNote = true;
        }

        /**
         * Select a drum sound to replace the pitch of any contained notes.
         *
         * @param {String} drum - drum name
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block object in blocks.blockList
         */
        static setDrum(drum, turtle, blk) {
            let drumname = DEFAULTDRUM;
            for (const d in DRUMNAMES) {
                if (DRUMNAMES[d][0] === drum) {
                    drumname = DRUMNAMES[d][1];
                } else if (DRUMNAMES[d][1] === drum) {
                    drumname = drum;
                }
            }

            const tur = logo.turtles.ithTurtle(turtle);

            tur.singer.drumStyle.push(drumname);

            const listenerName = "_setdrum_" + turtle;
            if (blk !== undefined && blk in blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                tur.singer.drumStyle.pop();
                tur.singer.pitchDrumTable = {};
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
            if (logo.inRhythmRuler) {
                logo._currentDrumBlock = blk;
                logo.rhythmRuler.Drums.push(blk);
                logo.rhythmRuler.Rulers.push([[], []]);
            }
        }

        /**
         * Replace every instance of a pitch with a drum sound.
         *
         * @param {String} drum - drum name
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block object in blocks.blockList
         */
        static mapPitchToDrum(drum, turtle, blk) {
            let drumname = DEFAULTDRUM;
            for (const d in DRUMNAMES) {
                if (DRUMNAMES[d][0] === drum) {
                    drumname = DRUMNAMES[d][1];
                } else if (DRUMNAMES[d][1] === drum) {
                    drumname = drum;
                }
            }

            const tur = logo.turtles.ithTurtle(turtle);

            tur.singer.drumStyle.push(drumname);

            const listenerName = "_mapdrum_" + turtle;
            if (blk !== undefined && blk in blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => tur.singer.drumStyle.pop();

            logo.setTurtleListener(turtle, listenerName, __listener);
            if (logo.inRhythmRuler) {
                logo._currentDrumBlock = blk;
                logo.rhythmRuler.Drums.push(blk);
                logo.rhythmRuler.Rulers.push([[], []]);
            }
        }

        /**
         * Generate white, pink, or brown noise.
         *
         * @param {String} noise - noise name
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} blk - corresponding Block index in blocks.blockList
         */
        static playNoise(noise, turtle, blk) {
            let noisename = noise;
            for (const n in NOISENAMES) {
                if (NOISENAMES[n][0] === noise) {
                    noisename = NOISENAMES[n][1];
                    break;
                } else if (NOISENAMES[n][1] === noise) {
                    noisename = noise;
                    break;
                }
            }

            const tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.inNoteBlock.length > 0) {
                // Add the noise sound as if it were a drum
                tur.singer.noteDrums[last(tur.singer.inNoteBlock)].push(noisename);
                if (tur.singer.synthVolume[noisename] === undefined) {
                    tur.singer.synthVolume[noisename] = [DEFAULTVOLUME];
                    tur.singer.crescendoInitialVolume[noisename] = [DEFAULTVOLUME];
                }
                tur.singer.noteBeatValues[last(tur.singer.inNoteBlock)].push(tur.singer.beatFactor);

                tur.singer.pushedNote = true;
            } else {
                logo.errorMsg(_("Noise Block: Did you mean to use a Note block?"), blk);
                return;
            }
        }
    };
}
