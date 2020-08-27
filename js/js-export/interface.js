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

    // ========= Parameter Validation ==============================================================

    /**
     * @static
     * lookup table for API method names to argument constraints
     */
    static _methodArgConstraints = {
        // Rhythm blocks
        "playNote": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 1000,
                    "integer": false
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "playNoteMillis": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100000,
                    "integer": false
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "dot": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 10,
                    "integer": true
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "tie": [
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "multiplyNoteValue": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 1000,
                    "integer": false
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "swing": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 1000,
                    "integer": false
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 1000,
                    "integer": false
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        // Meter blocks
        "setMeter": [
            {
                "type": "number",
                "constraints": {
                    "min": 1,
                    "max": 16,
                    "integer": true
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 1000,
                    "integer": false
                }
            }
        ],
        "PICKUP": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 1000,
                    "integer": false
                }
            }
        ],
        "setBPM": [
            {
                "type": "number",
                "constraints": {
                    "min": 40,
                    "max": 208,
                    "integer": true
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 10,
                    "integer": false
                }
            }
        ],
        "setMasterBPM": [
            {
                "type": "number",
                "constraints": {
                    "min": 40,
                    "max": 208,
                    "integer": true
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 10,
                    "integer": false
                }
            }
        ],
        "onEveryNoteDo": [
            {
                "type": "string",
                "constraints": {
                    "type": "any"
                }
            }
        ],
        "onEveryBeatDo": [
            {
                "type": "string",
                "constraints": {
                    "type": "any"
                }
            }
        ],
        "onStrongBeatDo": [
            {
                "type": "number",
                "constraints": {
                    "min": 1,
                    "max": 16,
                    "integer": true
                }
            },
            {
                "type": "string",
                "constraints": {
                    "type": "any"
                }
            }
        ],
        "onWeakBeatDo": [
            {
                "type": "string",
                "constraints": {
                    "type": "any"
                }
            }
        ],
        "setNoClock": [
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "getNotesPlayed": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 1000,
                    "integer": false
                }
            }
        ],
        // Pitch blocks
        "playPitch": [
            {
                "type": "string",
                "constraints": {
                    "type": "solfegeorletter"
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 1,
                    "max": 8,
                    "integer": true
                }
            }
        ],
        "stepPitch": [
            {
                "type": "number",
                "constraints": {
                    "min": -7,
                    "max": 7,
                    "integer": true
                }
            }
        ],
        "playNthModalPitch": [
            {
                "type": "number",
                "constraints": {
                    "min": -7,
                    "max": 7,
                    "integer": true
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 1,
                    "max": 8,
                    "integer": true
                }
            }
        ],
        "playPitchNumber": [
            {
                "type": "number",
                "constraints": {
                    "min": -3,
                    "max": 12,
                    "integer": true
                }
            }
        ],
        "playHertz": [
            {
                "type": "number",
                "constraints": {
                    "min": 20,
                    "max": 20000,
                    "integer": false
                }
            }
        ],
        "setAccidental": [
            {
                "type": "string",
                "constraints": {
                    "type": "accidental"
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "setScalarTranspose": [
            {
                "type": "number",
                "constraints": {
                    "min": -10,
                    "max": 10,
                    "integer": true
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "setSemitoneTranspose": [
            {
                "type": "number",
                "constraints": {
                    "min": -10,
                    "max": 10,
                    "integer": true
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "setRegister": [
            {
                "type": "number",
                "constraints": {
                    "min": -3,
                    "max": 3,
                    "integer": true
                }
            }
        ],
        "invert": [
            {
                "type": "string",
                "constraints": {
                    "type": "solfegeorletter"
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 1,
                    "max": 8,
                    "integer": true
                }
            },
            {
                "type": "string",
                "constraints": {
                    "type": "oneof",
                    "values": ["even", "odd", "scalar"]
                }
            }
        ],
        "setPitchNumberOffset": [
            {
                "type": "string",
                "constraints": {
                    "type": "solfegeorletter"
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 1,
                    "max": 8,
                    "integer": true
                }
            }
        ],
        "numToPitch": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": true
                }
            }
        ],
        "numToOctave": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": true
                }
            }
        ],
        // Intervals blocks
        "setKey": [
            {
                "type": "string",
                "constraints": {
                    "type": "letterkey"
                }
            },
            {
                "type": "string",
                "constraints": {
                    "type": "mode"
                }
            }
        ],
        "MOVEABLEDO": [
            {
                "type": "boolean"
            }
        ],
        "setScalarInterval": [
            {
                "type": "number",
                "constraints": {
                    "min": -7,
                    "max": 7,
                    "integer": true
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "setSemitoneInterval": [
            {
                "type": "number",
                "constraints": {
                    "min": -12,
                    "max": 12,
                    "integer": true
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "setTemperament": [
            {
                "type": "string",
                "constraints": {
                    "type": "temperament"
                }
            },
            {
                "type": "string",
                "constraints": {
                    "type": "solfegeorletter"
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 10,
                    "integer": true
                }
            }
        ],
        // Tone blocks
        "setInstrument": [
            {
                "type": "string",
                "constraints": {
                    "type": "instrument"
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "doVibrato": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 10,
                    "integer": false
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 10,
                    "integer": false
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "doChorus": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 10,
                    "integer": false
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 10,
                    "integer": false
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": false
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "doPhaser": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 20,
                    "integer": false
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 3,
                    "integer": true
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 20,
                    "max": 20000,
                    "integer": false
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "doTremolo": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 20,
                    "integer": false
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": true
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "doDistortion": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": true
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "doHarmonic": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 11,
                    "integer": true
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        // Ornament blocks
        "setStaccato": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 1000,
                    "integer": false
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "setSlur": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 1000,
                    "integer": false
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "doNeighbor": [
            {
                "type": "number",
                "constraints": {
                    "min": -7,
                    "max": 7,
                    "integer": true
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 1000,
                    "integer": false
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        // Volume blocks
        "doCrescendo": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": false
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "doDecrescendo": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": false
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "PANNING": [
            {
                "type": "number",
                "constraints": {
                    "min": -100,
                    "max": 100,
                    "integer": true
                }
            }
        ],
        "MASTERVOLUME": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": true
                }
            }
        ],
        "setRelativeVolume": [
            {
                "type": "number",
                "constraints": {
                    "min": -50,
                    "max": 50,
                    "integer": false
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "setSynthVolume": [
            {
                "type": "string",
                "constraints": {
                    "type": "synth"
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": false
                }
            }
        ],
        "getSynthVolume": [
            {
                "type": "string",
                "constraints": {
                    "type": "synth"
                }
            }
        ],
        // Drum blocks
        "playDrum": [
            {
                "type": "string",
                "constraints": {
                    "type": "drum"
                }
            }
        ],
        "setDrum": [
            {
                "type": "string",
                "constraints": {
                    "type": "drum"
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "mapPitchToDrum": [
            {
                "type": "string",
                "constraints": {
                    "type": "drum"
                }
            },
            {
                "type": "function",
                "constraints": {
                    "async": true
                }
            }
        ],
        "playNoise": [
            {
                "type": "string",
                "constraints": {
                    "type": "noise"
                }
            }
        ],
        // Graphics blocks
        "goForward": [
            {
                "type": "number",
                "constraints": {
                    "min": -100000,
                    "max": 100000,
                    "integer": false
                }
            }
        ],
        "goBackward": [
            {
                "type": "number",
                "constraints": {
                    "min": -100000,
                    "max": 100000,
                    "integer": false
                }
            }
        ],
        "turnRight": [
            {
                "type": "number",
                "constraints": {
                    "min": -360,
                    "max": 360,
                    "integer": false
                }
            }
        ],
        "turnLeft": [
            {
                "type": "number",
                "constraints": {
                    "min": -360,
                    "max": 360,
                    "integer": false
                }
            }
        ],
        "setXY": [
            {
                "type": "number",
                "constraints": {
                    "min": -100000,
                    "max": 100000,
                    "integer": false
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": -100000,
                    "max": 100000,
                    "integer": false
                }
            }
        ],
        "setHeading": [
            {
                "type": "number",
                "constraints": {
                    "min": -360,
                    "max": 360,
                    "integer": false
                }
            }
        ],
        "drawArc": [
            {
                "type": "number",
                "constraints": {
                    "min": -360,
                    "max": 360,
                    "integer": false
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100000,
                    "integer": false
                }
            }
        ],
        "drawBezier": [
            {
                "type": "number",
                "constraints": {
                    "min": -100000,
                    "max": 100000,
                    "integer": false
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": -100000,
                    "max": 100000,
                    "integer": false
                }
            }
        ],
        "setBezierControlPoint1": [
            {
                "type": "number",
                "constraints": {
                    "min": -100000,
                    "max": 100000,
                    "integer": false
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": -100000,
                    "max": 100000,
                    "integer": false
                }
            }
        ],
        "setBezierControlPoint1": [
            {
                "type": "number",
                "constraints": {
                    "min": -100000,
                    "max": 100000,
                    "integer": false
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": -100000,
                    "max": 100000,
                    "integer": false
                }
            }
        ],
        "scrollXY": [
            {
                "type": "number",
                "constraints": {
                    "min": -100000,
                    "max": 100000,
                    "integer": false
                }
            },
            {
                "type": "number",
                "constraints": {
                    "min": -100000,
                    "max": 100000,
                    "integer": false
                }
            }
        ],
        // Pen blocks
        "setColor": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": true
                }
            }
        ],
        "setGrey": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": true
                }
            }
        ],
        "setShade": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": true
                }
            }
        ],
        "setHue": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": true
                }
            }
        ],
        "setTranslucency": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": true
                }
            }
        ],
        "setPensize": [
            {
                "type": "number",
                "constraints": {
                    "min": 0,
                    "max": 100,
                    "integer": true
                }
            }
        ]
    };

    static logError(message, color) {
        if (color === undefined)
            color = "gold";
        console.log("%c" + message, `color: ${color}`);
    }

    /**
     * Validates arguments passed to API methods.
     * In case of invalidity, defaults to acceptable value if possible, else throws error message.
     *
     * @static
     * @param {String} methodName - API method name
     * @param {[*]} args - list of arguments
     * @returns {[*]} - list of valid arguments
     */
    static validateArgs(methodName, args) {
        if (!methodName in JSInterface._methodArgConstraints)
            return args;

        let constraints = JSInterface._methodArgConstraints[methodName];
        let finalArgs = [];
        for (let i in constraints) {
            let [arg, props] = [args[i], constraints[i]];
            if (typeof arg !== props["type"]) {
                if (typeof arg === "string" && props["type"] === "number") {
                    if (!isNaN(Number(arg))) {
                        arg = Number(arg);
                    } else {
                        let error = `TypeMismatch error: expected "number" but found "string"`;
                        JSInterface.logError(error, "red");
                        throw error;
                    }
                } else {
                    let error =
                        `TypeMismatch error: expected "${props["type"]}" but found "${typeof arg}"`;
                    JSInterface.logError(error, "red");
                    throw error;
                }
            }

            switch (props["type"]) {
                case "number":
                    if (arg < props["constraints"]["min"]) {
                        JSInterface.logError(
                            `${arg} in "${methodName}" reset to ${props["constraints"]["min"]}`
                        );
                        arg = props["constraints"]["min"];
                    } else if (arg > props["constraints"]["max"]) {
                        JSInterface.logError(
                            `${arg} in "${methodName}" reset to ${props["constraints"]["max"]}`
                        );
                        arg = props["constraints"]["min"];
                    }

                    if (props["constraints"]["integer"] && !Number.isInteger(arg)) {
                        JSInterface.logError(
                            `${arg} in "${methodName}" reset to ${Math.floor(arg)}`
                        );
                        arg = Math.floor(arg);
                    }
                    break;

                case "function":
                    if (
                        props["constraints"]["async"] &&
                        arg[Symbol.toStringTag] !== "AsyncFunction"
                    ) {
                        let error = `${args[0]} error: expected "async" function`;
                        JSInterface.logError(error, "red");
                        throw error;
                    }
                    break;
            }

            finalArgs.push(arg);
        }

        return finalArgs;
    }
}
