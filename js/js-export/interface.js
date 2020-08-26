/**
 * @file This contains the utilities for the interface between Music Blocks blocks and JavaScript
 * based Music Blocks API.
 * @author Anindya Kundu
 *
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
 * Private members' names begin with underscore '_".
*/

/**
 * @class
 * @classdesc contains the lists and lookups for relevant blocks, and utility methods to access them.
 */
class JSInterface {
    /**
     * @static
     * list of clamp block names
     */
    static _clampBlocks = [
        // Rhythm blocks
        "newnote",
        "osctime",
        "rhythmicdot2",
        "tie",
        "multiplybeatfactor",
        "newswing2",
        // Meter blocks
        "drift",
        // Pitch blocks
        "accidental",
        "setscalartransposition",
        "settransposition",
        "invert1",
        // Intervals blocks
        "definemode",
        "interval",
        "semitoneinterval",
        // Tone blocks
        "settimbre",
        "vibrato",
        "chorus",
        "phaser",
        "tremolo",
        "dis",
        "harmonic2",
        // Ornament blocks
        "newstaccato",
        "newslur",
        "neighbor2",
        // Volume blocks
        "crescendo",
        "decrescendo",
        "articulation",
        // Drum blocks
        "setdrum",
        "mapdrum"
    ]

    /**
     * @static
     * lookup table for block names to setter names
     */
    static _setterNameLookup = {
            // Meter blocks
        "pickup": "PICKUP",
            // Intervals blocks
        "movable": "MOVEABLE",
            // Volume blocks
        "setnotevolume": "MASTERVOLUME",
        "setpanning": "PANNING",
    };

    /**
     * @static
     * lookup table for block names to getter names
     */
    static _getterNameLookup = {
            // Rhythm blocks
        "mynotevalue": "NOTEVALUE",
            // Meter blocks
        "elapsednotes": "WHOLENOTESPLAYED",
        "beatvalue": "BEATCOUNT",
        "measurevalue": "MEASURECOUNT",
        "bpmfactor": "BPM",
        "beatfactor": "BEATFACTOR",
        "currentmeter": "CURRENTMETER",
            // Pitch blocks
        "deltapitch2": "SCALARCHANGEINPITCH",
        "deltapitch": "CHANGEINPITCH",
        "consonantstepsizeup": "SCALARSTEPUP",
        "consonantstepsizedown": "SCALARSTEPDOWN",
            // Intervals blocks
        "key": "CURRENTKEY",
        "currentmode": "CURRENTMODE",
        "modelength": "MODELENGTH",
            // Volume blocks
        "notevolumefactor": "MASTERVOLUME"
    };

    /**
     * @static
     * lookup table for block names to API method names
     */
    static _methodNameLookup = {
            // Rhythm blocks
        "newnote": "playNote",
        "osctime": "playNoteMillis",
        "rest2": "playRest",
        "rhythmicdot2": "dot",
        "tie": "tie",
        "multiplybeatfactor": "multiplyNoteValue",
        "newswing2": "swing",
            // Meter blocks
        "meter": "setMeter",
        "setbpm3": "setBPM",
        "setmasterbpm2": "setMasterBPM",
        "everybeatdo": "onEveryNoteDo",
        "everybeatdonew": "onEveryBeatDo",
        "onbeatdo": "onStrongBeatDo",
        "offbeatdo": "onWeakBeatDo",
        "drift": "setNoClock",
        "elapsednotes2": "getNotesPlayed",
            // Pitch blocks
        "pitch": "playPitch",
        "steppitch": "stepPitch",
        "nthmodalpitch": "playNthModalPitch",
        "pitchnumber": "playPitchNumber",
        "hertz": "playHertz",
        "accidental": "setAccidental",
        "setscalartransposition": "setScalarTranspose",
        "settransposition": "setSemitoneTranspose",
        "register": "setRegister",
        "invert1": "invert",
        "setpitchnumberoffset": "setPitchNumberOffset",
        "number2pitch": "numToPitch",
        "number2octave": "numToOctave",
            // Intervals blocks
        "setkey2": "setKey",
        // "definemode": "defineMode",
        "interval": "setScalarInterval",
        "semitoneinterval": "setSemitoneInterval",
        "settemperament": "setTemperament",
            // Tone blocks
        "settimbre": "setInstrument",
        "vibrato": "doVibrato",
        "chorus": "doChorus",
        "phaser": "doPhaser",
        "tremolo": "doTremolo",
        "dis": "doDistortion",
        "harmonic2": "doHarmonic",
            // Ornament blocks
        "newstaccato": "setStaccato",
        "newslur": "setSlur",
        "neighbor2": "doNeighbor",
            // Volume blocks
        "crescendo": "doCrescendo",
        "decrescendo": "doDecrescendo",
        "articulation": "setRelativeVolume",
        "setsynthvolume": "setSynthVolume",
        "synthvolumefactor": "getSynthVolume",
            // Drum blocks
        "playdrum": "playDrum",
        "setdrum": "setDrum",
        "mapdrum": "mapPitchToDrum",
        "playnoise": "playNoise",
        // Number blocks
        "random": "MathUtility.doRandom",
        "oneOf": "MathUtility.doOneOf",
        "distance": "MathUtility.doCalculateDistance",
        // Graphics blocks
        "forward": "doForward",
        "back": "doForward",
        "right": "doRight",
        "left": "doRight",
        "setxy": "doSetXY",
        "setheading": "doSetHeading",
        "arc": "doArc",
        "bezier": "doBezier",
        "controlpoint1": "setControlPoint1",
        "controlpoint2": "setControlPoint2",
        "clear": "doClear",
        "scrollxy": "doScrollXY",
        // Pen blocks
        "setcolor": "doSetColor",
        "setgrey": "doSetChroma",
        "setshade": "doSetValue",
        "sethue": "doSetHue",
        "settranslucency": "doSetPenAlpha",
        "setpensize": "doSetPensize",
        "penup": "doPenUp",
        "pendown": "doPenDown",
        // "": "doStartFill",
        // "": "doStartHollowLine",
        // "": "fillBackground",
        "setfont": "doSetFont",
        // Extras
        "print": "print"
    };

    /**
     * Returns whether passed argument is the name of a clamp block.
     *
     * @param {String} blockName
     * @returns {Boolean}
     */
    static isClampBlock(blockName) {
        return JSInterface._clampBlocks.indexOf(blockName) !== -1;
    }

    /**
     * Returns whether passed argument corresponds to a setter.
     *
     * @param {String} blockName
     * @returns {Boolean}
     */
    static isSetter(blockName) {
        return blockName in JSInterface._setterNameLookup;
    }

    /**
     * Returns whether passed argument corresponds to a getter.
     *
     * @param {String} blockName
     * @returns {Boolean}
     */
    static isGetter(blockName) {
        return blockName in JSInterface._getterNameLookup;
    }

    /**
     * Returns whether passed argument corresponds to a method.
     *
     * @param {String} blockName
     * @returns {Boolean}
     */
    static isMethod(blockName) {
        return blockName in JSInterface._methodNameLookup;
    }

    /**
     * Returns the setter name corresponding to the blockname, returns "null" if doesn't exist.
     *
     * @param {String} blockName
     * @returns {String}
     */
    static getSetterName(blockName) {
        return JSInterface.isSetter(blockName) ? JSInterface._setterNameLookup[blockName] : null;
    }

    /**
     * Returns the getter name corresponding to the blockname, returns "null" if doesn't exist.
     *
     * @param {String} blockName
     * @returns {String}
     */
    static getGetterName(blockName) {
        return JSInterface.isGetter(blockName) ? JSInterface._getterNameLookup[blockName] : null;
    }

    /**
     * Returns the method name corresponding to the blockname, returns "null" if doesn't exist.
     *
     * @param {String} blockName
     * @returns {String}
     */
    static getMethodName(blockName) {
        return JSInterface.isMethod(blockName) ? JSInterface._methodNameLookup[blockName] : null;
    }
}
