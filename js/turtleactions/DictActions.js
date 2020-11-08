/**
 * @file This contains the action methods of the Turtle's Singer component's Dictionary blocks.
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
 * Sets up all the methods related to different actions for each block in Dictionary palette.
 *
 * @returns {void}
 */
function setupDictActions() {
    Turtle.DictActions = class {
        /**
         * Utility function to get Turtle properties associated with target (used by get value).
         *
         * @static
         * @param {Number} target - target Turtle index in turtle.turtleList
         * @param {Number} turtle - Turtle index in turtle.turtleList
         * @param {String} k - key
         * @returns {String|Number}
         */
        static _GetDict(target, turtle, k) {
            const targetTur = turtles.ithTurtle(target);

            // This is the internal turtle dictionary that includes the turtle status.
            if (k === _("color")) {
                return targetTur.painter.color;
            } else if (k === _("shade")) {
                return targetTur.painter.value;
            } else if (k === _("grey")) {
                return targetTur.painter.chroma;
            } else if (k === _("pen size")) {
                return targetTur.painter.pensize;
            } else if (k === _("font")) {
                return targetTur.painter.font;
            } else if (k === _("heading")) {
                return targetTur.painter.heading;
            } else if (k === "x") {
                return turtles.screenX2turtleX(targetTur.container.x);
            } else if (k === "y") {
                return turtles.screenY2turtleY(targetTur.container.y);
            } else if (k === _("notes played")) {
                return targetTur.singer.notesPlayed[0] / targetTur.singer.notesPlayed[1];
            } else if (k === _("note value")) {
                return Singer.RhythmActions.getNoteValue(target);
            } else if (k === _("current pitch")) {
                return targetTur.singer.lastNotePlayed[0];
            } else if (k === _("pitch number")) {
                let obj;
                if (targetTur.singer.lastNotePlayed !== null) {
                    let len = targetTur.singer.lastNotePlayed[0].length;
                    let pitch = targetTur.singer.lastNotePlayed[0].slice(0, len - 1);
                    let octave = parseInt(targetTur.singer.lastNotePlayed[0].slice(len - 1));

                    obj = [pitch, octave];
                } else if (targetTur.singer.notePitches.length > 0) {
                    obj = getNote(
                        targetTur.singer.notePitches[0],
                        targetTur.singer.noteOctaves[0],
                        0,
                        targetTur.singer.keySignature,
                        targetTur.singer.moveable,
                        null,
                        logo.errorMsg,
                        logo.synth.inTemperament
                    );
                } else {
                    console.debug("Cannot find a note for mouse " + target);
                    logo.errorMsg(INVALIDPITCH, blk);
                    obj = ["G", 4];
                }

                return (
                    pitchToNumber(obj[0], obj[1], targetTur.singer.keySignature) -
                    targetTur.singer.pitchNumberOffset
                );
            } else {
                if (target in logo.turtleDicts[turtle]) {
                    return logo.turtleDicts[turtle][target][k];
                }
            }
            return 0;
        }

        /**
         * utility function to set a value corresponding to a key
         *
         * @static
         * @param {Number} target - target Turtle index in turtle.turtleList
         * @param {Number} turtle - Turtle index in turtle.turtleList
         * @param {String} k - key
         * @param {*} v - value
         * @returns {void}
         */
        static SetDictValue(target, turtle, k, v) {
            const targetTur = turtles.ithTurtle(target);

            // This is the internal turtle dictionary that includes the turtle status.
            if (k === _("color")) {
                targetTur.painter.doSetColor(v);
            } else if (k === _("shade")) {
                targetTur.painter.doSetValue(v);
            } else if (k === _("grey")) {
                targetTur.painter.doSetChroma(v);
            } else if (k === _("pen size")) {
                targetTur.painter.doSetPensize(v);
            } else if (k === _("font")) {
                targetTur.painter.doSetFont(v);
            } else if (k === _("heading")) {
                targetTur.painter.doSetHeading(v);
            } else if (k === "y") {
                let x = turtles.screenX2turtleX(targetTur.container.x);
                targetTur.painter.doSetXY(x, v);
            } else if (k === "x") {
                let y = turtles.screenY2turtleY(targetTur.container.y);
                targetTur.painter.doSetXY(v, y);
            } else {
                if (!(target in logo.turtleDicts[turtle])) {
                    logo.turtleDicts[turtle][target] = {};
                }
                logo.turtleDicts[turtle][target][k] = v;
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
            const targetTur = turtles.ithTurtle(target);

            // This is the internal turtle dictionary that includes the turtle status.
            let this_dict = {};
            this_dict[_("color")] = targetTur.painter.color;
            this_dict[_("shade")] = targetTur.painter.value;
            this_dict[_("grey")] = targetTur.painter.chroma;
            this_dict[_("pen size")] = targetTur.painter.stroke;
            this_dict[_("font")] = targetTur.painter.font;
            this_dict[_("heading")] = targetTur.painter.orientation;
            this_dict["y"] = turtles.screenY2turtleY(targetTur.container.y);
            this_dict["x"] = turtles.screenX2turtleX(targetTur.container.x);

            if (target in logo.turtleDicts[turtle]) {
                for (let k in logo.turtleDicts[turtle][target]) {
                    this_dict[k] = logo.turtleDicts[turtle][target][k];
                }
            }
            return JSON.stringify(this_dict);
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
            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                logo.turtleDicts[turtle] = {};
            }

            // Is the dictionary the same as a turtle name?
            const target = getTargetTurtle(turtles, dict);
            if (target !== null) {
                logo.textMsg(Turtle.DictActions.SerializeDict(target, turtle));
                return;
            } else if (!(dict in logo.turtleDicts[turtle])) {
                logo.turtleDicts[turtle][dict] = {};
            }

            logo.textMsg(JSON.stringify(logo.turtleDicts[turtle][dict]));
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
            if (!(turtle in logo.turtleDicts)) {
                return 0;
            }

            // Is the dictionary the same as a turtle name?
            let target = getTargetTurtle(turtles, dict);
            if (target !== null) {
                Turtle.DictActions.SetDictValue(target, turtle, key, value);
                return;
            } else if (!(dict in logo.turtleDicts[turtle])) {
                logo.turtleDicts[turtle][dict] = {};
            }

            logo.turtleDicts[turtle][dict][key] = value;
        }

        /**
         * Returns a value in the dictionary for a specified key.
         *
         * @static
         * @param {String|Number} dict - dictionary name
         * @param {String|Number} key
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {String|Number}
         */
        static getValue(dict, key, turtle) {
            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                return 0;
            }

            // Is the dictionary the same as a turtle name?
            let target = getTargetTurtle(turtles, dict);
            if (target !== null) {
                return Turtle.DictActions._GetDict(target, turtle, key);
            } else if (!(dict in logo.turtleDicts[turtle])) {
                return 0;
            }

            return logo.turtleDicts[turtle][dict][key];
        }
    };
}
