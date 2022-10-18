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

/* global JSEditor, SHARP, FLAT, NATURAL, DOUBLESHARP, DOUBLEFLAT, DEFAULTVOICE */

/* exported JSInterface */

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
    ];

    /**
     * @static
     * list of methods having a return value
     */
    static _returningMethods = ["getDict", "getDict2", "dictionary"];

    /**
     * @static
     * lookup table for block names to setter names
     */
    static _setterNameLookup = {
        // Meter blocks
        pickup: "PICKUP",
        // Intervals blocks
        movable: "MOVEABLE",
        // Volume blocks
        setnotevolume: "MASTERVOLUME",
        setpanning: "PANNING"
    };

    /**
     * @static
     * lookup table for block names to getter names
     */
    static _getterNameLookup = {
        // Rhythm blocks
        mynotevalue: "NOTEVALUE",
        // Meter blocks
        elapsednotes: "WHOLENOTESPLAYED",
        beatvalue: "BEATCOUNT",
        measurevalue: "MEASURECOUNT",
        bpmfactor: "BPM",
        beatfactor: "BEATFACTOR",
        currentmeter: "CURRENTMETER",
        // Pitch blocks
        deltapitch2: "SCALARCHANGEINPITCH",
        deltapitch: "CHANGEINPITCH",
        consonantstepsizeup: "SCALARSTEPUP",
        consonantstepsizedown: "SCALARSTEPDOWN",
        // Intervals blocks
        key: "CURRENTKEY",
        currentmode: "CURRENTMODE",
        modelength: "MODELENGTH",
        // Volume blocks
        notevolumefactor: "MASTERVOLUME",
        // Graphics blocks
        x: "X",
        y: "Y",
        heading: "HEADING",
        // Pen blocks
        pensize: "PENSIZE",
        color: "COLOR",
        shade: "SHADE",
        grey: "GREY"
    };

    /**
     * @static
     * lookup table for block names to API method names
     */
    static _methodNameLookup = {
        // Rhythm blocks
        newnote: "playNote",
        osctime: "playNoteMillis",
        rest2: "playRest",
        rhythmicdot2: "dot",
        tie: "tie",
        multiplybeatfactor: "multiplyNoteValue",
        newswing2: "swing",
        // Meter blocks
        meter: "setMeter",
        setbpm3: "setBPM",
        setmasterbpm2: "setMasterBPM",
        everybeatdo: "onEveryNoteDo",
        everybeatdonew: "onEveryBeatDo",
        onbeatdo: "onStrongBeatDo",
        offbeatdo: "onWeakBeatDo",
        drift: "setNoClock",
        elapsednotes2: "getNotesPlayed",
        // Pitch blocks
        pitch: "playPitch",
        steppitch: "stepPitch",
        nthmodalpitch: "playNthModalPitch",
        pitchnumber: "playPitchNumber",
        hertz: "playHertz",
        accidental: "setAccidental",
        setscalartransposition: "setScalarTranspose",
        settransposition: "setSemitoneTranspose",
        register: "setRegister",
        invert1: "invert",
        setpitchnumberoffset: "setPitchNumberOffset",
        number2pitch: "numToPitch",
        number2octave: "numToOctave",
        // Intervals blocks
        setkey2: "setKey",
        // "definemode": "defineMode",
        interval: "setScalarInterval",
        semitoneinterval: "setSemitoneInterval",
        settemperament: "setTemperament",
        // Tone blocks
        settimbre: "setInstrument",
        vibrato: "doVibrato",
        chorus: "doChorus",
        phaser: "doPhaser",
        tremolo: "doTremolo",
        dis: "doDistortion",
        harmonic2: "doHarmonic",
        // Ornament blocks
        newstaccato: "setStaccato",
        newslur: "setSlur",
        neighbor2: "doNeighbor",
        // Volume blocks
        crescendo: "doCrescendo",
        decrescendo: "doDecrescendo",
        articulation: "setRelativeVolume",
        setsynthvolume: "setSynthVolume",
        synthvolumefactor: "getSynthVolume",
        // Drum blocks
        playdrum: "playDrum",
        setdrum: "setDrum",
        mapdrum: "mapPitchToDrum",
        playnoise: "playNoise",
        // Number blocks
        random: "MathUtility.doRandom",
        oneOf: "MathUtility.doOneOf",
        distance: "MathUtility.doCalculateDistance",
        // Graphics blocks
        forward: "goForward",
        back: "goBackward",
        right: "turnRight",
        left: "turnLeft",
        setxy: "setXY",
        setheading: "setHeading",
        arc: "drawArc",
        bezier: "drawBezier",
        controlpoint1: "setBezierControlPoint1",
        controlpoint2: "setBezierControlPoint2",
        clear: "clear",
        scrollxy: "scrollXY",
        // Pen blocks
        setcolor: "setColor",
        setgrey: "setGrey",
        setshade: "setShade",
        sethue: "setHue",
        settranslucency: "setTranslucency",
        setpensize: "setPensize",
        penup: "penUp",
        pendown: "penDown",
        // "": "doStartFill",
        // "": "doStartHollowLine",
        background: "fillBackground",
        setfont: "setFont",
        // Dictionary blocks
        dictionary: "getDict",
        setDict: "setValue",
        getDict: "getValue",
        setDict2: "setValue",
        getDict2: "getValue",
        // Extras
        print: "print"
    };

    /**
     * @static
     * maps block name to corresponding API args order
     */
    static _rearrangeArgsLookup = {
        setDict: [1, 2, 0],
        getDict: [1, 0]
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
     * Returns whether passed argument corresponds to a method.
     *
     * @param {String} blockName
     * @returns {Boolean}
     */
    static methodReturns(blockName) {
        return JSInterface._returningMethods.indexOf(blockName) !== -1;
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

    /**
     * Rearranges the method arguments as required by the API.
     *
     * @param {String} methodName
     * @param {[*]} args
     * @returns {[*]}
     */
    static rearrangeMethodArgs(methodName, args) {
        if (methodName in JSInterface._rearrangeArgsLookup) {
            args = JSInterface._rearrangeArgsLookup[methodName].map((index) => args[index]);
        }
        return args;
    }

    // ========= Parameter Validation ==============================================================

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
        // JSInterface._methodArgConstraints is defined in ./constraints.js

        if (!(methodName in JSInterface._methodArgConstraints)) return args;

        const constraints = JSInterface._methodArgConstraints[methodName];
        const finalArgs = [];
        for (const i in constraints) {
            let [arg, props] = [args[i], constraints[i]];

            // for multiple types
            if (Array.isArray(props)) {
                for (const prop of props) {
                    if (typeof arg === prop["type"]) {
                        props = prop;
                        break;
                    }
                }
                if (Array.isArray(props)) {
                    const error = `TypeMismatch error: expected one of "${props
                        .map((prop) => prop["type"])
                        .toString()}" but found "${typeof arg}"`;
                    JSEditor.logConsole(error, "maroon");
                    throw error;
                }
            }

            if (typeof arg !== props["type"]) {
                if (typeof arg === "string" && props["type"] === "number") {
                    if (!isNaN(Number(arg))) {
                        arg = Number(arg);
                    } else {
                        const error = 'TypeMismatch error: expected "number" but found "string"';
                        JSEditor.logConsole(error, "maroon");
                        throw error;
                    }
                } else if (typeof arg === "string" && props["type"] === "boolean") {
                    if (arg.toLowerCase() === "true") {
                        arg = true;
                    } else if (arg.toLowerCase() === "false") {
                        arg = false;
                    } else {
                        JSEditor.logConsole(`${arg} in "${methodName}" reset to ${true}`);
                        arg = true;
                    }
                } else {
                    const error = `TypeMismatch error: expected "${
                        props["type"]
                    }" but found "${typeof arg}"`;
                    JSEditor.logConsole(error, "maroon");
                    throw error;
                }
            }

            switch (props["type"]) {
                case "number":
                    if (arg < props["constraints"]["min"]) {
                        JSEditor.logConsole(
                            `${arg} in "${methodName}" reset to ${props["constraints"]["min"]}`
                        );
                        arg = props["constraints"]["min"];
                    } else if (arg > props["constraints"]["max"]) {
                        JSEditor.logConsole(
                            `${arg} in "${methodName}" reset to ${props["constraints"]["max"]}`
                        );
                        arg = props["constraints"]["max"];
                    }

                    if (props["constraints"]["integer"] && !Number.isInteger(arg)) {
                        JSEditor.logConsole(
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
                        const error = `${args[0]} error: expected "async" function`;
                        JSEditor.logConsole(error, "maroon");
                        throw error;
                    }
                    break;

                case "string":
                    if (props["constraints"]["type"] === "solfegeorletter") {
                        const strs = arg.split(" ");
                        const solfeges = ["do", "re", "mi", "fa", "sol", "la", "ti"];
                        const letters = ["c", "d", "e", "f", "g", "a", "b"];
                        if (
                            solfeges.indexOf(strs[0].toLowerCase()) !== -1 ||
                            letters.indexOf(strs[0].toLowerCase()) !== -1
                        ) {
                            if (solfeges.indexOf(strs[0].toLowerCase()) !== -1) {
                                arg = strs[0].toLowerCase();
                            } else {
                                arg = strs[0].toUpperCase();
                            }

                            if (strs.length > 1) {
                                const accidentals = [SHARP, FLAT, NATURAL, DOUBLESHARP, DOUBLEFLAT];
                                const accidentals2 = {
                                    sharp: SHARP,
                                    flat: FLAT,
                                    doublesharp: DOUBLESHARP,
                                    doubleflat: DOUBLEFLAT
                                };

                                if (accidentals.indexOf(strs[1]) !== -1) {
                                    arg += strs[1];
                                } else if (strs[1].toLowerCase() in accidentals2) {
                                    arg += accidentals2[strs[1].toLowerCase()];
                                }
                            }
                        } else {
                            JSEditor.logConsole(`${arg} in "${methodName}" reset to ${"sol"}`);
                            arg = "sol";
                        }
                    } else if (props["constraints"]["type"] === "accidental") {
                        const accidentalOuts = [
                            `sharp ${SHARP}`,
                            `flat ${FLAT}`,
                            `natural ${NATURAL}`,
                            `double sharp ${DOUBLESHARP}`,
                            `double flat ${DOUBLEFLAT}`
                        ];
                        const accidentals = [SHARP, FLAT, NATURAL, DOUBLESHARP, DOUBLEFLAT];
                        const accidentals2 = [
                            "sharp",
                            "flat",
                            "natural",
                            "doublesharp",
                            "doubleflat"
                        ];

                        if (accidentals.indexOf(arg) !== -1) {
                            arg = accidentalOuts[accidentals.indexOf(arg)];
                        } else if (accidentals2.indexOf(arg.toLowerCase()) !== -1) {
                            arg = accidentalOuts[accidentals2.indexOf(arg.toLowerCase())];
                        }
                    } else if (props["constraints"]["type"] === "oneof") {
                        let index = -1;
                        for (const i in props["constraints"]["values"]) {
                            if (
                                props["constraints"]["values"][i].toLowerCase() ===
                                arg.toLowerCase()
                            ) {
                                index = i;
                                break;
                            }
                        }
                        if (index !== -1) {
                            arg = props["constraints"]["values"][index];
                        } else {
                            JSEditor.logConsole(
                                `${arg} in "${methodName}" reset to ${
                                    props["constraints"]["values"][
                                        props["constraints"]["defaultIndex"]
                                    ]
                                }`
                            );
                            arg =
                                props["constraints"]["values"][
                                    props["constraints"]["defaultIndex"]
                                ];
                        }
                    } else if (props["constraints"]["type"] === "synth") {
                        const instruments = [
                            "piano",
                            "violin",
                            "viola",
                            "cello",
                            "bass",
                            "double bass",
                            "guitar",
                            "acoustic guitar",
                            "flute",
                            "clarinet",
                            "saxophone",
                            "tuba",
                            "trumpet",
                            "oboe",
                            "trombone",
                            "banjo",
                            "koto",
                            "dulcimer",
                            "electric guitar",
                            "bassoon",
                            "celeste",
                            "xylophone",
                            "electronic synth",
                            "sine",
                            "square",
                            "sawtooth",
                            "triangle",
                            "vibraphone"
                        ];
                        if (instruments.indexOf(arg) !== -1) {
                            arg = arg.toLowerCase();
                        } else {
                            JSEditor.logConsole(
                                `${arg} in "${methodName}" reset to ${DEFAULTVOICE}`
                            );
                            arg = DEFAULTVOICE;
                        }
                    } else if (props["constraints"]["type"] === "drum") {
                        const drums = [
                            "snare drum",
                            "kick drum",
                            "tom tom",
                            "floor tom tom",
                            "cup drum",
                            "darbuka drum",
                            "japanese drum",
                            "hi hat",
                            "ride bell",
                            "cow bell",
                            "triangle bell",
                            "finger cymbals",
                            "chime",
                            "gong",
                            "clang",
                            "crash",
                            "clap",
                            "slap",
                            "raindrop"
                        ];
                        if (drums.indexOf(arg) !== -1) {
                            arg = arg.toLowerCase();
                        } else {
                            JSEditor.logConsole(
                                `${arg} in "${methodName}" reset to ${"kick drum"}`
                            );
                            arg = "kick drum";
                        }
                    } else if (props["constraints"]["type"] === "noise") {
                        if (arg.toLowerCase() === "white noise") {
                            arg = "noise1";
                        } else if (arg.toLowerCase() === "brown noise") {
                            arg = "noise2";
                        } else if (arg.toLowerCase() === "pink noise") {
                            arg = "noise3";
                        } else {
                            JSEditor.logConsole(
                                `${arg} in "${methodName}" reset to ${"white noise"}`
                            );
                            arg = "noise1";
                        }
                    } else if (props["constraints"]["type"] === "letterkey") {
                        const strs = arg.split(" ");
                        const letters = ["c", "d", "e", "f", "g", "a", "b"];
                        if (letters.indexOf(strs[0].toLowerCase()) !== -1) {
                            arg = strs[0].toUpperCase();

                            if (strs.length > 1) {
                                const accidentals = [SHARP, FLAT, NATURAL, DOUBLESHARP, DOUBLEFLAT];
                                const accidentals2 = {
                                    sharp: SHARP,
                                    flat: FLAT,
                                    doublesharp: DOUBLESHARP,
                                    doubleflat: DOUBLEFLAT
                                };

                                if (accidentals.indexOf(strs[1]) !== -1) {
                                    arg += strs[1];
                                } else if (strs[1].toLowerCase() in accidentals2) {
                                    arg += accidentals2[strs[1].toLowerCase()];
                                }
                            }
                        } else {
                            JSEditor.logConsole(`${arg} in "${methodName}" reset to ${"C"}`);
                            arg = "C";
                        }
                    }
                    break;
            }

            finalArgs.push(arg);
        }

        return finalArgs;
    }
}
