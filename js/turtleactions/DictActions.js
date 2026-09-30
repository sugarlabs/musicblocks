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
   getTargetTurtle, frequencyToPitch, noteToObj
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
        getNote, pitchToNumber, frequencyToPitch, noteToObj
    js/logo.js
        INVALIDPITCH
    js/blocks/EnsembleBlocks.js
        getTargetTurtle
*/

/* exported setupDictActions */

// English names of the internal turtle dictionary keys handled by _GetDict.
const TURTLEKEYS = [
    "color",
    "shade",
    "grey",
    "pen size",
    "font",
    "heading",
    "x",
    "y",
    "notes played",
    "note value",
    "current pitch",
    "pitch number"
];

/**
 * Sets up all the methods related to different actions for each block in Dictionary palette.
 * @returns {void}
 */
function setupDictActions(activity) {
    Turtle.DictActions = class {
        /**
         * Utility function to get the English name of an internal turtle dictionary key.
         * The turtle key block always stores the English name. A typed key matches its
         * English name or its translation in the current language.
         *
         * @static
         * @param {String} key - key
         * @returns {String|null} English key name, or null if key is not an internal key
         */
        static TurtleKey(key) {
            for (const name of TURTLEKEYS) {
                if (key === name || key === _(name)) {
                    return name;
                }
            }
            return null;
        }

        /**
         * Utility function to list the English names of the internal turtle dictionary keys,
         * the choices offered by the turtle key block.
         *
         * @static
         * @returns {String[]}
         */
        static TurtleKeys() {
            return TURTLEKEYS.slice();
        }

        /**
         * Utility function to check whether a key is one of the internal turtle dictionary keys
         * handled by _GetDict.
         *
         * @static
         * @param {String} key - key
         * @returns {Boolean}
         */
        static IsTurtleKey(key) {
            return Turtle.DictActions.TurtleKey(key) !== null;
        }

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
            const name = Turtle.DictActions.TurtleKey(key);

            // This is the internal turtle dictionary that includes the turtle status.
            if (name === "color") {
                return targetTur.painter.color;
            } else if (name === "shade") {
                return targetTur.painter.value;
            } else if (name === "grey") {
                return targetTur.painter.chroma;
            } else if (name === "pen size") {
                return targetTur.painter.stroke;
            } else if (name === "font") {
                return targetTur.painter.font;
            } else if (name === "heading") {
                return targetTur.painter.turtle.orientation;
            } else if (name === "x") {
                return activity.turtles.screenX2turtleX(targetTur.container.x);
            } else if (name === "y") {
                return activity.turtles.screenY2turtleY(targetTur.container.y);
            } else if (name === "notes played") {
                return targetTur.singer.notesPlayed[0] / targetTur.singer.notesPlayed[1];
            } else if (name === "note value") {
                return Singer.RhythmActions.getNoteValue(target);
            } else if (name === "current pitch") {
                if (targetTur.singer.lastNotePlayed === null) {
                    return "G4";
                }
                return targetTur.singer.lastNotePlayed[0];
            } else if (name === "pitch number") {
                let obj;
                if (targetTur.singer.lastNotePlayed !== null) {
                    if (typeof targetTur.singer.lastNotePlayed[0] === "number") {
                        obj = frequencyToPitch(
                            targetTur.singer.lastNotePlayed[0],
                            activity.logo.synth.inTemperament
                        );
                    } else {
                        obj = noteToObj(targetTur.singer.lastNotePlayed[0]);
                    }
                } else if (targetTur.singer.notePitches.length > 0) {
                    obj = getNote(
                        targetTur.singer.notePitches[0],
                        targetTur.singer.noteOctaves[0],
                        0,
                        targetTur.singer.keySignature,
                        targetTur.singer.movable,
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
            } else {
                activity.errorMsg(
                    _("Unknown key: %s").replace(/%s/g, () => key),
                    blk
                );
                return 0;
            }
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
            const name = Turtle.DictActions.TurtleKey(key);

            // This is the internal turtle dictionary that includes the turtle status.
            if (name === "color") {
                targetTur.painter.doSetColor(value);
            } else if (name === "shade") {
                targetTur.painter.doSetValue(value);
            } else if (name === "grey") {
                targetTur.painter.doSetChroma(value);
            } else if (name === "pen size") {
                targetTur.painter.doSetPensize(value);
            } else if (name === "font") {
                targetTur.painter.doSetFont(value);
            } else if (name === "heading") {
                targetTur.painter.doSetHeading(value);
            } else if (name === "y") {
                const x = activity.turtles.screenX2turtleX(targetTur.container.x);
                targetTur.painter.doSetXY(x, value);
            } else if (name === "x") {
                const y = activity.turtles.screenY2turtleY(targetTur.container.y);
                targetTur.painter.doSetXY(value, y);
            } else if (
                name === "notes played" ||
                name === "note value" ||
                name === "current pitch" ||
                name === "pitch number"
            ) {
                activity.errorMsg(_("Cannot set read-only key: %s").replace(/%s/g, () => key));
            }
        }

        /**
         * Alias for SetDictValue for backward compatibility.
         *
         * @static
         * @param {Number} target - target Turtle index in turtle.turtleList
         * @param {Number} turtle - Turtle index in turtle.turtleList
         * @param {String} key - key
         * @param {*} value - value
         * @returns {void}
         */
        static setDictValue(target, turtle, key, value) {
            Turtle.DictActions.SetDictValue(target, turtle, key, value);
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
            this_dict[_("heading")] = targetTur.painter.turtle.orientation;
            this_dict["y"] = activity.turtles.screenY2turtleY(targetTur.container.y);
            this_dict["x"] = activity.turtles.screenX2turtleX(targetTur.container.x);

            if (
                turtle in activity.logo.turtleDicts &&
                target in activity.logo.turtleDicts[turtle]
            ) {
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
                dict in activity.logo.turtleDicts[turtle]
                    ? activity.logo.turtleDicts[turtle][dict]
                    : {}
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
            if (!(turtle in activity.logo.turtleDicts)) {
                activity.logo.turtleDicts[turtle] = {};
            }

            // Is the dictionary the same as a turtle name?
            const target = getTargetTurtle(activity.turtles, dict);
            if (target !== null) {
                if (Turtle.DictActions.IsTurtleKey(key)) {
                    Turtle.DictActions.SetDictValue(target, turtle, key, value);
                    return;
                }
                // Other keys are stored where SerializeDict reads them.
                dict = target;
            }

            if (!(dict in activity.logo.turtleDicts[turtle])) {
                activity.logo.turtleDicts[turtle][dict] = {};
            }
            activity.logo.turtleDicts[turtle][dict][key] = value;
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
            if (!(turtle in activity.logo.turtleDicts)) {
                activity.logo.turtleDicts[turtle] = {};
            }

            // Is the dictionary the same as a turtle name?
            const target = getTargetTurtle(activity.turtles, dict);
            if (target !== null) {
                if (Turtle.DictActions.IsTurtleKey(key)) {
                    return Turtle.DictActions._GetDict(target, turtle, key, blk);
                }
                const turtleDict = activity.logo.turtleDicts[turtle][target];
                if (
                    turtleDict === undefined ||
                    !Object.prototype.hasOwnProperty.call(turtleDict, key)
                ) {
                    const msg = _("Key with this name does not exist in %s").replace(
                        /%s/g,
                        () => dict
                    );
                    activity.errorMsg(msg, blk);
                    return 0;
                }
                return turtleDict[key];
            }

            if (!(dict in activity.logo.turtleDicts[turtle])) {
                const msg = _("Dictionary with this name does not exist");
                activity.errorMsg(msg, blk);
                return 0;
            } else if (!(key in activity.logo.turtleDicts[turtle][dict])) {
                const msg = _("Key with this name does not exist in %s").replace(/%s/g, dict);
                activity.errorMsg(msg, blk);
                return 0;
            }

            return activity.logo.turtleDicts[turtle][dict][key];
        }
    };
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = setupDictActions;
}
