/**
 * @file This contains the action methods of the Turtle's Singer component's Dictionary blocks.
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

   _, Turtle, Singer, getNote, INVALIDPITCH, pitchToNumber,
   getTargetTurtle
 */

/*
   Global Locations
    js/utils/utils.js
        _
    js/turtle.js
        Turtle
    js/turtle-singer.js
        Singer
    js/utils/musicutils.js
        getNote, pitchToNumber
    js/logo.js
        INVALIDPITCH
    js/blocks/EnsembleBlocks.js
        getTargetTurtle
*/

/* exported setupDictActions */

/**
 * Sets up all the methods related to different actions for each block in Dictionary palette.
 * @returns {void}
 */
function setupDictActions(activity) {
    Turtle.DictActions = class {
        /**
         * Utility function to get Turtle properties associated with target (used by get value).
         *
         * @static
         * @param {Number} target - target Turtle index in turtle.turtleList
         * @param {Number} turtle - Turtle index in turtle.turtleList
         * @param {String} key - key
         * @param {Number?} blk - block index in blocks.blockList
         * @returns {String|Number}
         */
        static _GetDict(target, turtle, key, blk) {
            const targetTur = activity.turtles.ithTurtle(target);

            // This is the internal turtle dictionary that includes the turtle status.
            if (key === _("color")) {
                return targetTur.painter.color;
            } else if (key === _("shade")) {
                return targetTur.painter.value;
            } else if (key === _("grey")) {
                return targetTur.painter.chroma;
            } else if (key === _("pen size")) {
                return targetTur.painter.pensize;
            } else if (key === _("font")) {
                return targetTur.painter.font;
            } else if (key === _("heading")) {
                return targetTur.painter.heading;
            } else if (key === "x") {
                return activity.turtles.screenX2turtleX(targetTur.container.x);
            } else if (key === "y") {
                return activity.turtles.screenY2turtleY(targetTur.container.y);
            } else if (key === _("notes played")) {
                return targetTur.singer.notesPlayed[0] / targetTur.singer.notesPlayed[1];
            } else if (key === _("note value")) {
                return Singer.RhythmActions.getNoteValue(target);
            } else if (key === _("current pitch")) {
                return targetTur.singer.lastNotePlayed[0];
            } else if (key === _("pitch number")) {
                let obj;
                if (targetTur.singer.lastNotePlayed !== null) {
                    const len = targetTur.singer.lastNotePlayed[0].length;
                    const pitch = targetTur.singer.lastNotePlayed[0].slice(0, len - 1);
                    const octave = parseInt(targetTur.singer.lastNotePlayed[0].slice(len - 1));

                    obj = [pitch, octave];
                } else if (targetTur.singer.notePitches.length > 0) {
                    obj = getNote(
                        targetTur.singer.notePitches[0],
                        targetTur.singer.noteOctaves[0],
                        0,
                        targetTur.singer.keySignature,
                        targetTur.singer.moveable,
                        null,
                        activity.errorMsg,
                        activity.logo.synth.inTemperament
                    );
                } else {
                    activity.errorMsg(INVALIDPITCH, blk);
                    obj = ["G", 4];
                }

                return (
                    pitchToNumber(obj[0], obj[1], targetTur.singer.keySignature) -
                    targetTur.singer.pitchNumberOffset
                );
            } else if (
                target in activity.logo.turtleDicts &&
                target in activity.logo.turtleDicts[target] &&
                key in activity.logo.turtleDicts[target][target]
            ) {
                return activity.logo.turtleDicts[target][target][key];
            } else {
                if (target in activity.logo.turtleDicts[turtle]) {
                    return activity.logo.turtleDicts[turtle][target][key];
                }
            }
            return 0;
        }

        /**
         * Utility function to set a value corresponding to a key.
         *
         * @static
         * @param {Number} target - target Turtle index in turtle.turtleList
         * @param {Number} turtle - Turtle index in turtle.turtleList
         * @param {String} key - key
         * @param {*} value - value
         * @returns {void}
         */
        static SetDictValue(target, turtle, key, value) {
            const targetTur = activity.turtles.ithTurtle(target);

            // This is the internal turtle dictionary that includes the turtle status.
            if (key === _("color")) {
                targetTur.painter.doSetColor(value);
            } else if (key === _("shade")) {
                targetTur.painter.doSetValue(value);
            } else if (key === _("grey")) {
                targetTur.painter.doSetChroma(value);
            } else if (key === _("pen size")) {
                targetTur.painter.doSetPensize(value);
            } else if (key === _("font")) {
                targetTur.painter.doSetFont(value);
            } else if (key === _("heading")) {
                targetTur.painter.doSetHeading(value);
            } else if (key === "y") {
                const x = activity.turtles.screenX2turtleX(targetTur.container.x);
                targetTur.painter.doSetXY(x, value);
            } else if (key === "x") {
                const y = activity.turtles.screenY2turtleY(targetTur.container.y);
                targetTur.painter.doSetXY(value, y);
            } else {
                if (!(target in activity.logo.turtleDicts[turtle])) {
                    activity.logo.turtleDicts[turtle][target] = {};
                }
                activity.logo.turtleDicts[turtle][target][key] = value;
            }
        }

        /**
         * Utility function to display dictionary as JSON.
         *
         * @static
         * @param {Number} target - target Turtle index in turtle.turtleList
         * @param {Number} turtle - Turtle index in turtle.turtleList
         * @returns {String}
         */
        static SerializeDict(target, turtle) {
            const targetTur = activity.turtles.ithTurtle(target);

            // This is the internal turtle dictionary that includes the turtle status.
            const this_dict = {};
            this_dict[_("color")] = targetTur.painter.color;
            this_dict[_("shade")] = targetTur.painter.value;
            this_dict[_("grey")] = targetTur.painter.chroma;
            this_dict[_("pen size")] = targetTur.painter.stroke;
            this_dict[_("font")] = targetTur.painter.font;
            this_dict[_("heading")] = targetTur.painter.orientation;
            this_dict["y"] = activity.turtles.screenY2turtleY(targetTur.container.y);
            this_dict["x"] = activity.turtles.screenX2turtleX(targetTur.container.x);

            if (target in activity.logo.turtleDicts[turtle]) {
                for (const key in activity.logo.turtleDicts[turtle][target]) {
                    this_dict[key] = activity.logo.turtleDicts[turtle][target][key];
                }
            }
            return JSON.stringify(this_dict);
        }

        /**
         * Returns the contents of the queried dictionary.
         *
         * @static
         * @param {String|Number} dict - dictionary name
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {String}
         */
        static getDict(dict, turtle) {
            // Not sure this can happen.
            if (!(turtle in activity.logo.turtleDicts)) activity.logo.turtleDicts[turtle] = {};

            // Is the dictionary the same as a turtle name?
            const target = getTargetTurtle(activity.turtles, dict);
            if (target !== null) {
                return Turtle.DictActions.SerializeDict(target, turtle);
            }

            return JSON.stringify(
                dict in activity.logo.turtleDicts[turtle] ? activity.logo.turtleDicts[turtle][dict] : {}
            );
        }

        /**
         * Displays the contents of the queried dictionary.
         *
         * @static
         * @param {String|Number} dict - dictionary name
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {void}
         */
        static showDict(dict, turtle) {
            activity.textMsg(Turtle.DictActions.getDict(dict, turtle));
        }

        /**
         * Sets a value in the dictionary for a specified key.
         *
         * @static
         * @param {String|Number} dict - dictionary name
         * @param {String|Number} key
         * @param {String|Number} value
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {void}
         */
        static setValue(dict, key, value, turtle) {
            // Not sure this can happen.
            if (!(turtle in activity.logo.turtleDicts)) return 0;

            // Is the dictionary the same as a turtle name?
            const target = getTargetTurtle(activity.turtles, dict);
            if (target !== null) {
                Turtle.DictActions.SetDictValue(target, turtle, key, value);
            } else {
                if (!(dict in activity.logo.turtleDicts[turtle])) {
                    activity.logo.turtleDicts[turtle][dict] = {};
                }
                activity.logo.turtleDicts[turtle][dict][key] = value;
            }
        }

        /**
         * Returns a value in the dictionary for a specified key.
         *
         * @static
         * @param {String|Number} dict - dictionary name
         * @param {String|Number} key
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number?} blk - block index in blocks.blockList
         * @returns {String|Number}
         */
        static getValue(dict, key, turtle, blk) {
            // Not sure this can happen.
            if (!(turtle in activity.logo.turtleDicts)) return 0;
            // Is the dictionary the same as a turtle name?
            const target = getTargetTurtle(activity.turtles, dict);
            if (target !== null) {
                return Turtle.DictActions._GetDict(target, turtle, key, blk);
            } else if (!(dict in activity.logo.turtleDicts[turtle])) {
                return 0;
            }

            return activity.logo.turtleDicts[turtle][dict][key];
        }
    };
}
