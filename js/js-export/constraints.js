/**
 * @file This contains the constraints for the method arguments of JavaScript based Music Blocks API.
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
 */

/* global JSInterface */

/**
 * @static
 * lookup table for API method names to argument constraints
 */
JSInterface._methodArgConstraints = {
    // Rhythm blocks
    playNote: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 1000,
                integer: false
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    playNoteMillis: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100000,
                integer: false
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    dot: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 10,
                integer: true
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    tie: [
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    multiplyNoteValue: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 1000,
                integer: false
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    swing: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 1000,
                integer: false
            }
        },
        {
            type: "number",
            constraints: {
                min: 0,
                max: 1000,
                integer: false
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    // Meter blocks
    setMeter: [
        {
            type: "number",
            constraints: {
                min: 1,
                max: 16,
                integer: true
            }
        },
        {
            type: "number",
            constraints: {
                min: 0,
                max: 1000,
                integer: false
            }
        }
    ],
    PICKUP: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 1000,
                integer: false
            }
        }
    ],
    setBPM: [
        {
            type: "number",
            constraints: {
                min: 40,
                max: 208,
                integer: true
            }
        },
        {
            type: "number",
            constraints: {
                min: 0,
                max: 10,
                integer: false
            }
        }
    ],
    setMasterBPM: [
        {
            type: "number",
            constraints: {
                min: 40,
                max: 208,
                integer: true
            }
        },
        {
            type: "number",
            constraints: {
                min: 0,
                max: 10,
                integer: false
            }
        }
    ],
    onEveryNoteDo: [
        {
            type: "string",
            constraints: {
                type: "any"
            }
        }
    ],
    onEveryBeatDo: [
        {
            type: "string",
            constraints: {
                type: "any"
            }
        }
    ],
    onStrongBeatDo: [
        {
            type: "number",
            constraints: {
                min: 1,
                max: 16,
                integer: true
            }
        },
        {
            type: "string",
            constraints: {
                type: "any"
            }
        }
    ],
    onWeakBeatDo: [
        {
            type: "string",
            constraints: {
                type: "any"
            }
        }
    ],
    setNoClock: [
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    getNotesPlayed: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 1000,
                integer: false
            }
        }
    ],
    // Pitch blocks
    playPitch: [
        {
            type: "string",
            constraints: {
                type: "solfegeorletter"
            }
        },
        {
            type: "number",
            constraints: {
                min: 1,
                max: 8,
                integer: true
            }
        }
    ],
    stepPitch: [
        {
            type: "number",
            constraints: {
                min: -7,
                max: 7,
                integer: true
            }
        }
    ],
    playNthModalPitch: [
        {
            type: "number",
            constraints: {
                min: -7,
                max: 7,
                integer: true
            }
        },
        {
            type: "number",
            constraints: {
                min: 1,
                max: 8,
                integer: true
            }
        }
    ],
    playPitchNumber: [
        {
            type: "number",
            constraints: {
                min: -3,
                max: 12,
                integer: true
            }
        }
    ],
    playHertz: [
        {
            type: "number",
            constraints: {
                min: 20,
                max: 20000,
                integer: false
            }
        }
    ],
    setAccidental: [
        {
            type: "string",
            constraints: {
                type: "accidental"
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    setScalarTranspose: [
        {
            type: "number",
            constraints: {
                min: -10,
                max: 10,
                integer: true
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    setSemitoneTranspose: [
        {
            type: "number",
            constraints: {
                min: -10,
                max: 10,
                integer: true
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    setRegister: [
        {
            type: "number",
            constraints: {
                min: -3,
                max: 3,
                integer: true
            }
        }
    ],
    invert: [
        {
            type: "string",
            constraints: {
                type: "solfegeorletter"
            }
        },
        {
            type: "number",
            constraints: {
                min: 1,
                max: 8,
                integer: true
            }
        },
        {
            type: "string",
            constraints: {
                type: "oneof",
                values: ["even", "odd", "scalar"],
                defaultIndex: 0
            }
        }
    ],
    setPitchNumberOffset: [
        {
            type: "string",
            constraints: {
                type: "solfegeorletter"
            }
        },
        {
            type: "number",
            constraints: {
                min: 1,
                max: 8,
                integer: true
            }
        }
    ],
    numToPitch: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: true
            }
        }
    ],
    numToOctave: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: true
            }
        }
    ],
    // Intervals blocks
    setKey: [
        {
            type: "string",
            constraints: {
                type: "letterkey"
            }
        },
        {
            type: "string",
            constraints: {
                type: "oneof",
                values: [
                    "major",
                    "ionian",
                    "dorian",
                    "phrygian",
                    "lydian",
                    "myxolydian",
                    "minor",
                    "aeolian"
                ],
                defaultIndex: 0
            }
        }
    ],
    MOVEABLEDO: [
        {
            type: "boolean"
        }
    ],
    setScalarInterval: [
        {
            type: "number",
            constraints: {
                min: -7,
                max: 7,
                integer: true
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    setSemitoneInterval: [
        {
            type: "number",
            constraints: {
                min: -12,
                max: 12,
                integer: true
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    setTemperament: [
        {
            type: "string",
            constraints: {
                type: "oneof",
                values: [
                    "equal",
                    "just intonation",
                    "Pythagorean",
                    "1/3 comma meantone",
                    "1/4 comma meantone"
                ],
                defaultIndex: 0
            }
        },
        {
            type: "string",
            constraints: {
                type: "solfegeorletter"
            }
        },
        {
            type: "number",
            constraints: {
                min: 0,
                max: 10,
                integer: true
            }
        }
    ],
    // Tone blocks
    setInstrument: [
        {
            type: "string",
            constraints: {
                type: "synth"
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    doVibrato: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 10,
                integer: false
            }
        },
        {
            type: "number",
            constraints: {
                min: 0,
                max: 10,
                integer: false
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    doChorus: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 10,
                integer: false
            }
        },
        {
            type: "number",
            constraints: {
                min: 0,
                max: 10,
                integer: false
            }
        },
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: false
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    doPhaser: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 20,
                integer: false
            }
        },
        {
            type: "number",
            constraints: {
                min: 0,
                max: 3,
                integer: true
            }
        },
        {
            type: "number",
            constraints: {
                min: 20,
                max: 20000,
                integer: false
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    doTremolo: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 20,
                integer: false
            }
        },
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: true
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    doDistortion: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: true
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    doHarmonic: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 11,
                integer: true
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    // Ornament blocks
    setStaccato: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 1000,
                integer: false
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    setSlur: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 1000,
                integer: false
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    doNeighbor: [
        {
            type: "number",
            constraints: {
                min: -7,
                max: 7,
                integer: true
            }
        },
        {
            type: "number",
            constraints: {
                min: 0,
                max: 1000,
                integer: false
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    // Volume blocks
    doCrescendo: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: false
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    doDecrescendo: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: false
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    PANNING: [
        {
            type: "number",
            constraints: {
                min: -100,
                max: 100,
                integer: true
            }
        }
    ],
    MASTERVOLUME: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: true
            }
        }
    ],
    setRelativeVolume: [
        {
            type: "number",
            constraints: {
                min: -50,
                max: 50,
                integer: false
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    setSynthVolume: [
        {
            type: "string",
            constraints: {
                type: "synth"
            }
        },
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: false
            }
        }
    ],
    getSynthVolume: [
        {
            type: "string",
            constraints: {
                type: "synth"
            }
        }
    ],
    // Drum blocks
    playDrum: [
        {
            type: "string",
            constraints: {
                type: "drum"
            }
        }
    ],
    setDrum: [
        {
            type: "string",
            constraints: {
                type: "drum"
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    mapPitchToDrum: [
        {
            type: "string",
            constraints: {
                type: "drum"
            }
        },
        {
            type: "function",
            constraints: {
                async: true
            }
        }
    ],
    playNoise: [
        {
            type: "string",
            constraints: {
                type: "noise"
            }
        }
    ],
    // Graphics blocks
    goForward: [
        {
            type: "number",
            constraints: {
                min: -100000,
                max: 100000,
                integer: false
            }
        }
    ],
    goBackward: [
        {
            type: "number",
            constraints: {
                min: -100000,
                max: 100000,
                integer: false
            }
        }
    ],
    turnRight: [
        {
            type: "number",
            constraints: {
                min: -360,
                max: 360,
                integer: false
            }
        }
    ],
    turnLeft: [
        {
            type: "number",
            constraints: {
                min: -360,
                max: 360,
                integer: false
            }
        }
    ],
    setXY: [
        {
            type: "number",
            constraints: {
                min: -100000,
                max: 100000,
                integer: false
            }
        },
        {
            type: "number",
            constraints: {
                min: -100000,
                max: 100000,
                integer: false
            }
        }
    ],
    setHeading: [
        {
            type: "number",
            constraints: {
                min: -360,
                max: 360,
                integer: false
            }
        }
    ],
    drawArc: [
        {
            type: "number",
            constraints: {
                min: -360,
                max: 360,
                integer: false
            }
        },
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100000,
                integer: false
            }
        }
    ],
    drawBezier: [
        {
            type: "number",
            constraints: {
                min: -100000,
                max: 100000,
                integer: false
            }
        },
        {
            type: "number",
            constraints: {
                min: -100000,
                max: 100000,
                integer: false
            }
        }
    ],
    setBezierControlPoint1: [
        {
            type: "number",
            constraints: {
                min: -100000,
                max: 100000,
                integer: false
            }
        },
        {
            type: "number",
            constraints: {
                min: -100000,
                max: 100000,
                integer: false
            }
        }
    ],
    // setBezierControlPoint1: [
    //     {
    //         type: "number",
    //         constraints: {
    //             min: -100000,
    //             max: 100000,
    //             integer: false
    //         }
    //     },
    //     {
    //         type: "number",
    //         constraints: {
    //             min: -100000,
    //             max: 100000,
    //             integer: false
    //         }
    //     }
    // ],
    scrollXY: [
        {
            type: "number",
            constraints: {
                min: -100000,
                max: 100000,
                integer: false
            }
        },
        {
            type: "number",
            constraints: {
                min: -100000,
                max: 100000,
                integer: false
            }
        }
    ],
    // Pen blocks
    setColor: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: true
            }
        }
    ],
    setGrey: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: true
            }
        }
    ],
    setShade: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: true
            }
        }
    ],
    setHue: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: true
            }
        }
    ],
    setTranslucency: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: true
            }
        }
    ],
    setPensize: [
        {
            type: "number",
            constraints: {
                min: 0,
                max: 100,
                integer: true
            }
        }
    ],
    // Dictionary blocks
    setValue: [
        [
            {
                type: "string",
                constraints: {
                    type: "any"
                }
            },
            {
                type: "number",
                constraints: {
                    min: -1000,
                    max: 1000,
                    integer: true
                }
            }
        ],
        [
            {
                type: "string",
                constraints: {
                    type: "any"
                }
            },
            {
                type: "number",
                constraints: {
                    min: -1000,
                    max: 1000,
                    integer: true
                }
            }
        ],
        [
            {
                type: "string",
                constraints: {
                    type: "any"
                }
            },
            {
                type: "undefined"
            }
        ]
    ],
    getValue: [
        [
            {
                type: "string",
                constraints: {
                    type: "any"
                }
            },
            {
                type: "number",
                constraints: {
                    min: -1000,
                    max: 1000,
                    integer: true
                }
            }
        ],
        [
            {
                type: "string",
                constraints: {
                    type: "any"
                }
            },
            {
                type: "undefined"
            }
        ]
    ],
    getDict: [
        [
            {
                type: "string",
                constraints: {
                    type: "any"
                }
            },
            {
                type: "undefined"
            }
        ]
    ],
    showDict: [
        [
            {
                type: "string",
                constraints: {
                    type: "any"
                }
            },
            {
                type: "undefined"
            }
        ]
    ]
};
