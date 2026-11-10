/**
 * @file This contains the action methods of the Turtle's Singer component's Drum blocks.
 * @author Anindya Kundu
 * @author Walter Bender
 *
 * @copyright 2014-2021 Walter Bender
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
   global

   Singer, DEFAULTDRUM, DRUMNAMES, last, DEFAULTVOLUME, MusicBlocks,
   Mouse, NOISENAMES, _
*/

/*
   Global Locations
    js/utils/utils.js
        _
    js/turtle-singer.js
        Singer
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
function setupDrumActions(activity) {
    Singer.DrumActions = class {
        /**
         * Utility function that returns appropriate object key in DRUMNAMES corresponding to passed parameter.
         *
         * @static
         * @param {String} drum
         * @returns {String}
         */
        static GetDrumname(drum) {
            if (typeof drum !== "string") return DEFAULTDRUM;
            const trimmed = drum.trim();
            if (trimmed.slice(0, 4) === "http") return trimmed;

            const target = trimmed.toLowerCase();
            if (!target) return DEFAULTDRUM;
            const targetNoSpaces = target.replace(/\s+/g, "");

            if (typeof DRUMNAMES === "object" && DRUMNAMES !== null) {
                for (const [, value] of Object.entries(DRUMNAMES)) {
                    if (!value) continue;
                    const localized = typeof value[0] === "string" ? value[0].toLowerCase() : "";
                    const english = typeof value[1] === "string" ? value[1].toLowerCase() : "";
                    if (
                        localized === target ||
                        english === target ||
                        (targetNoSpaces &&
                            (localized.replace(/\s+/g, "") === targetNoSpaces ||
                                english.replace(/\s+/g, "") === targetNoSpaces))
                    ) {
                        return value[1];
                    }
                }
            }

            return DEFAULTDRUM;
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

            const tur = activity.turtles.ithTurtle(turtle);

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
                activity.logo.clearNoteParams(tur, blk, []);
                tur.singer.inNoteBlock.push(blk);
                tur.singer.noteDrums[last(tur.singer.inNoteBlock)].push(drumname);

                const noteBeatValue = 4;

                const __callback = () =>
                    tur.singer.inNoteBlock.splice(tur.singer.inNoteBlock.indexOf(blk), 1);

                Singer.processNote(activity, noteBeatValue, false, blk, turtle, __callback);
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
            const drumname = Singer.DrumActions.GetDrumname(drum);

            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.drumStyle.push(drumname);

            // pitchDrumTable is shared with the Map Pitch to Drum block, whose
            // mappings are meant to persist for the whole piece. Snapshot it so
            // the close listener can undo only what this clamp itself did to
            // it (see the closing listener below), instead of wiping every
            // mapping that happens to exist when this clamp closes.
            const pitchDrumTableSnapshot = { ...tur.singer.pitchDrumTable };

            const listenerName = "_setdrum_" + turtle + "_" + blk;
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (typeof MusicBlocks !== "undefined" && MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                tur.singer.drumStyle.pop();
                // Restore pitchDrumTable to what it was before this clamp
                // opened: entries this clamp added are discarded (so a note
                // played right after the clamp doesn't inherit its drum, per
                // #1381), and any entry this clamp overwrote is restored,
                // without touching mappings that predate the clamp.
                tur.singer.pitchDrumTable = pitchDrumTableSnapshot;
            };

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
            if (activity.logo.inRhythmRuler) {
                activity.logo._currentDrumBlock = blk;
                activity.logo.rhythmRuler.Drums.push(blk);
                activity.logo.rhythmRuler.Rulers.push([[], []]);
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
            const drumname = Singer.DrumActions.GetDrumname(drum);

            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.drumStyle.push(drumname);

            const listenerName = "_mapdrum_" + turtle;
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (typeof MusicBlocks !== "undefined" && MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => tur.singer.drumStyle.pop();

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
            if (activity.logo.inRhythmRuler) {
                activity.logo._currentDrumBlock = blk;
                activity.logo.rhythmRuler.Drums.push(blk);
                activity.logo.rhythmRuler.Rulers.push([[], []]);
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
            if (typeof noise !== "string") return;
            const trimmed = noise.trim();
            if (!trimmed) return;
            const target = trimmed.toLowerCase();
            const targetNoSpaces = target.replace(/\s+/g, "");

            // A noise sample can be loaded from a URL, just as a drum can. Only the
            // scheme is lower-cased; the rest of the URL is case-sensitive.
            const urlMatch = /^(https?):\/\/\S+/i.exec(trimmed);
            let noisename = null;
            if (urlMatch) {
                noisename = urlMatch[1].toLowerCase() + trimmed.slice(urlMatch[1].length);
            }

            if (!noisename && typeof NOISENAMES === "object" && NOISENAMES !== null) {
                for (const [, value] of Object.entries(NOISENAMES)) {
                    if (!value) continue;
                    const localized =
                        typeof value[0] === "string" ? value[0].trim().toLowerCase() : "";
                    const english =
                        typeof value[1] === "string" ? value[1].trim().toLowerCase() : "";
                    const localizedNoSpaces = localized.replace(/\s+/g, "");
                    const englishNoSpaces = english.replace(/\s+/g, "");
                    if (
                        localized === target ||
                        english === target ||
                        (targetNoSpaces &&
                            (localizedNoSpaces === targetNoSpaces ||
                                englishNoSpaces === targetNoSpaces)) ||
                        (localized &&
                            (localized.startsWith(target + " ") ||
                                localized.endsWith(" " + target))) ||
                        (english &&
                            (english.startsWith(target + " ") || english.endsWith(" " + target)))
                    ) {
                        noisename = value[1];
                        break;
                    }
                }
            }

            if (!noisename) {
                const colorMap = {
                    white: "noise1",
                    whitenoise: "noise1",
                    brown: "noise2",
                    brownnoise: "noise2",
                    pink: "noise3",
                    pinknoise: "noise3"
                };
                if (colorMap[target] || colorMap[targetNoSpaces]) {
                    noisename = colorMap[target] || colorMap[targetNoSpaces];
                }
            }

            if (!noisename) return;

            const tur = activity.turtles.ithTurtle(turtle);

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
                activity.errorMsg(_("Noise Block: Did you mean to use a Note block?"), blk);
                return;
            }
        }
    };
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = setupDrumActions;
}
