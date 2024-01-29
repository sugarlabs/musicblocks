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

/*
   global _, NOINPUTERRORMSG, Singer, MUSICALMODES, MusicBlocks, Mouse, getNote,
   getModeLength
*/

/*
   Global locations
    js/utils/utils.js
        _
    js/logo.js
        NOINPUTERRORMSG
    js/utils/musicutils.js
        MUSICALMODES, MODE_PIE_MENUS, getNote, getModeLength, NOTESTEP,
        GetNotesForInterval,ALLNOTESTEP,NOTENAMES,SEMITONETOINTERVALMAP
    js/turtle-singer.js
        Singer
    js/js-export/export.js
        MusicBlocks, Mouse
 */

/* exported setupIntervalsActions*/

/**
 * Sets up all the methods related to different actions for each block in Intervals palette.
 * @returns {void}
 */
function setupIntervalsActions(activity) {
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
            for (const _mode in MUSICALMODES) {
                if (_mode === mode || _(_mode) === mode) {
                    modename = _mode;
                    break;
                }
            }

            return modename;
        }

        /**
         * @static
         * @param {number} turtle
         * @returns {String}
         */
        static GetIntervalNumber(turtle) {
            const tur = activity.turtles.ithTurtle(turtle);
            let { firstNote, secondNote, octave } = GetNotesForInterval(tur);
            let totalIntervals = Math.abs(ALLNOTESTEP[firstNote] - ALLNOTESTEP[secondNote]);

            if (ALLNOTESTEP[secondNote] < ALLNOTESTEP[firstNote] && octave !== 0) totalIntervals = 12 - totalIntervals;

            if (octave < 0 && totalIntervals !== 0 && totalIntervals !== 12) totalIntervals = 12 - totalIntervals;
            
            if (octave < -1 || totalIntervals === 0) octave = Math.abs(octave);
            
            while (octave > 0) {
                totalIntervals += 12;
                octave--;
            }
            
            return totalIntervals;
        }

         /**
         * @static
         * @param {number} turtle
         * @returns {String}
         */

        static GetCurrentInterval(turtle) {
            const tur = activity.turtles.ithTurtle(turtle);

            const { firstNote, secondNote, octave } = GetNotesForInterval(tur);

            const index1 = NOTENAMES.indexOf(firstNote.substring(0, 1));
            const index2 = NOTENAMES.indexOf(secondNote.substring(0, 1));
            let lastWord = "";
            let letterGap = Math.abs(index2 - index1);
            
            if (index1 > index2 && octave !== 0) letterGap = NOTENAMES.length - letterGap;

            let totalIntervals = this.GetIntervalNumber(turtle);
            
            const numberToStringMap = [_('one'), _('two'), _('three'), _('four'), _('five'), _('six'), _('seven'), _('eight'), _('nine')]
            const plural = (Math.abs(octave) > 1) ? _('octaves') : _('octave');
            
            let os = numberToStringMap[Math.abs(octave) - 1] || Math.abs(octave);
            if (totalIntervals % 12 === 0 && letterGap === 0) {
                if (octave < 0) {
                    if(octave===-1)os = _('a')
                    const a = os + " " + _('perfect') + " "+ plural + " " + _("below");
                    return a.charAt(0).toUpperCase() + a.slice(1);
                }
                if (octave > 1) {
                    const a = os + " " + _('perfect') + " " + plural + " " + _("above");
                    return a.charAt(0).toUpperCase() + a.slice(1);
                }
            }
            
            if (totalIntervals > 21) {
                if (octave >=1) {
                    lastWord = ", " + _('plus') + " " + os + " " + plural;
                }    
                while (totalIntervals > 12) totalIntervals -= 12;
            }
            
            if (octave < 0) {
                letterGap = (letterGap !== 0) ? NOTENAMES.length - letterGap : letterGap;
                if (octave < -1) lastWord = `,  ${os} ${plural}`;
                lastWord += _(' below')
            }
            
            let interval = (totalIntervals % 12 === 0 && letterGap === 0) ? SEMITONETOINTERVALMAP[totalIntervals][letterGap] : SEMITONETOINTERVALMAP[totalIntervals][letterGap] + lastWord;
            return interval;
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
            const modename = Singer.IntervalsActions.GetModename(mode);
            const tur = activity.turtles.ithTurtle(turtle);
            const noteObj = getNote(
                key,
                4,
                tur.singer.transposition,
                tur.singer.keySignature,
                false,
                null,
                activity.errorMsg,
                activity.logo.synth.inTemperament
            );
            tur.singer.keySignature = noteObj[0] + " " + modename;
            activity.logo.notation.notationKey(turtle, noteObj[0], modename);
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
            return activity.turtles.ithTurtle(turtle).singer.keySignature.split(" ")[0];
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
            return activity.turtles.ithTurtle(turtle).singer.keySignature.split(" ")[1];
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
            return getModeLength(activity.turtles.ithTurtle(turtle).singer.keySignature);
        }

        /**
         * "movable do" block.
         * Attaches or detaches solfege names to specific pitches.
         *
         * @static
         * @param {Boolean} movable - whether solfeges are fixed or movable
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {void}
         */
        static setMovableDo(movable, turtle) {
            activity.turtles.ithTurtle(turtle).singer.movable = movable;
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
            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.inDefineMode = true;
            tur.singer.defineMode = [];
            let modeName;
            if (name === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                modeName = "custom";
            } else {
                modeName = name.toLowerCase();
            }

            const listenerName = "_definemode_" + turtle;
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                MUSICALMODES[modeName] = [];
                if (tur.singer.defineMode.indexOf(0) === -1) {
                    tur.singer.defineMode.push(0);
                    activity.errorMsg(_("Adding missing pitch number 0."));
                }

                const pitchNumbers = tur.singer.defineMode.sort((a, b) => a[0] - b[0]);

                for (let i = 0; i < pitchNumbers.length; i++) {
                    if (pitchNumbers[i] < 0 || pitchNumbers[i] > 11) {
                        activity.errorMsg(
                            _("Ignoring pitch numbers less than zero or greater than eleven.")
                        );
                        continue;
                    }

                    if (i > 0 && pitchNumbers[i] === pitchNumbers[i - 1]) {
                        activity.errorMsg(_("Ignoring duplicate pitch numbers."));
                        continue;
                    }

                    if (i < pitchNumbers.length - 1) {
                        MUSICALMODES[modeName].push(pitchNumbers[i + 1] - pitchNumbers[i]);
                    } else {
                        MUSICALMODES[modeName].push(12 - pitchNumbers[i]);
                    }
                }

                const cblk = activity.blocks.blockList[blk].connections[1];
                if (activity.blocks.blockList[cblk].name === "text") {
                    activity.blocks.updateBlockText(cblk);
                }

                tur.singer.inDefineMode = false;
            };

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
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
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1;
            }

            const tur = activity.turtles.ithTurtle(turtle);

            const i = arg > 0 ? Math.floor(arg) : Math.ceil(arg);
            tur.singer.intervals.push(i);

            const listenerName = "_interval_" + turtle;
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => tur.singer.intervals.pop();

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * "chord interval" block.
         * Calculates a scalar interval modified by a semitone interval
         *
         * @static
         * @param {Object} value - interval array: [scalar, semitone]
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number|String} [blk] - corresponding Block index in blocks.blockList
         * @returns {void}
         */
        static setChordInterval(obj, turtle, blk) {
            let arg = obj;
            if (arg === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = [1, 0];
            }

            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.chordIntervals.push(arg);

            const listenerName = "_chord_interval_" + turtle;
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => tur.singer.chordIntervals.pop();

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
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
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1;
            }

            const tur = activity.turtles.ithTurtle(turtle);

            const i = arg > 0 ? Math.floor(arg) : Math.ceil(arg);
            if (i !== 0) {
                tur.singer.semitoneIntervals.push([i, tur.singer.noteDirection]);
                tur.singer.noteDirection = 0;

                const listenerName = "_semitone_interval_" + turtle;
                if (blk !== undefined && blk in activity.blocks.blockList) {
                    activity.logo.setDispatchBlock(blk, turtle, listenerName);
                } else if (MusicBlocks.isRun) {
                    const mouse = Mouse.getMouseFromTurtle(tur);
                    if (mouse !== null) mouse.MB.listeners.push(listenerName);
                }

                const __listener = () => tur.singer.semitoneIntervals.pop();

                activity.logo.setTurtleListener(turtle, listenerName, __listener);
            }
        }

        /**
         * "ratio interval" block.
         * Calculates a relative interval based on a ratio.
         *
         * @static
         * @param {Number} value - ratio
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number|String} [blk] - corresponding Block index in blocks.blockList
         * @returns {void}
         */
        static setRatioInterval(value, turtle, blk) {
            let arg = value;
            if (arg === null || typeof arg !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1;
            }

            const tur = activity.turtles.ithTurtle(turtle);
            tur.singer.ratioIntervals.push(value);
            const listenerName = "_ratio_interval_" + turtle;
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => tur.singer.ratioIntervals.pop();

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
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
            activity.logo.synth.inTemperament = temperament;
            activity.logo.synth.startingPitch = pitch + "" + octave;

            activity.logo.temperamentSelected.push(temperament);
            const len = activity.logo.temperamentSelected.length;

            if (
                activity.logo.temperamentSelected[len - 1]
                    !== activity.logo.temperamentSelected[len - 2]
            ) {
                activity.logo.synth.changeInTemperament = true;
            }
        }
    };
}
