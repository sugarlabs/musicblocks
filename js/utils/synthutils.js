// Copyright (c) 2016-21 Walter Bender
// Copyright (c) 2025 Anvita Prasad DMP'25
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   _, last, Tone, require, getTemperament, pitchToNumber,
   getNoteFromInterval, FLAT, SHARP, pitchToFrequency, getCustomNote,
   getOctaveRatio, isCustomTemperament, Singer, DOUBLEFLAT, DOUBLESHARP,
   DEFAULTDRUM, getOscillatorTypes, numberToPitch, platform,
   getArticulation, piemenuPitches, docById, slicePath, wheelnav, platformColor,
   DEFAULTVOICE
*/

/*
   Global Locations
    - js/utils/utils.js
        _, last, docById
    - js/utils/musicutils.js
        pitchToNumber, getNoteFromInterval, FLAT, SHARP, pitchToFrequency, getCustomNote,
        isCustomTemperament, DOUBLEFLAT, DOUBLESHARP, DEFAULTDRUM, getOscillatorTypes, numberToPitch,
        getArticulation, getOctaveRatio, getTemperament, DEFAULTVOICE
    - js/turtle-singer.js
        Singer
    - js/utils/platformstyle.js
        platform, platformColor
    - js/piemenus.js
        piemenuPitches
    - js/utils/wheelnav.js
        wheelnav, slicePath
*/

/*
   exported

   NOISENAMES, VOICENAMES, DRUMNAMES, EFFECTSNAMES, CUSTOMSAMPLES,
   instrumentsEffects, instrumentsFilters, Synth
*/

/**
 * The number of voices in polyphony.
 * @constant
 * @type {number}
 * @default 3
 */
const POLYCOUNT = 3;

/**
 * Array of names and details for various noise synthesizers.
 * @constant
 * @type {Array<Array<string>>}
 */
const NOISENAMES = [
    //.TRANS: white noise synthesizer
    [_("white noise"), "noise1", "images/synth.svg", "electronic"],
    //.TRANS: brown noise synthesizer
    [_("brown noise"), "noise2", "images/synth.svg", "electronic"],
    //.TRANS: pink noise synthesizer
    [_("pink noise"), "noise3", "images/synth.svg", "electronic"]
];

/**
 * Array of names and details for various musical instruments.
 * @constant
 * @type {Array<Array<string>>}
 */
const VOICENAMES = [
    //.TRANS: musical instrument
    [_("piano"), "piano", "images/voices.svg", "string"],
    //.TRANS: musical instrument
    [_("violin"), "violin", "images/voices.svg", "string"],
    //.TRANS: viola musical instrument
    [_("viola"), "viola", "images/voices.svg", "string"],
    //.TRANS: musical instrument
    [_("cello"), "cello", "images/voices.svg", "string"],
    //.TRANS: musical instrument
    [_("bass"), "bass", "images/voices.svg", "string"],
    //.TRANS: viola musical instrument
    [_("double bass"), "double bass", "images/voices.svg", "string"],
    //.TRANS: sitar musical instrument
    [_("sitar"), "sitar", "images/synth.svg", "string"],
    //.TRANS: harmonium musical instrument
    [_("harmonium"), "harmonium", "images/voices.svg", "string"],
    //.TRANS: mandolin musical instrument
    [_("mandolin"), "mandolin", "images/voices.svg", "string"],
    //.TRANS: musical instrument
    [_("guitar"), "guitar", "images/voices.svg", "string"],
    //.TRANS: musical instrument
    [_("acoustic guitar"), "acoustic guitar", "images/voices.svg", "string"],
    //.TRANS: musical instrument
    [_("flute"), "flute", "images/voices.svg", "wind"],
    //.TRANS: musical instrument
    [_("clarinet"), "clarinet", "images/voices.svg", "wind"],
    //.TRANS: musical instrument
    [_("saxophone"), "saxophone", "images/voices.svg", "wind"],
    //.TRANS: musical instrument
    [_("tuba"), "tuba", "images/voices.svg", "wind"],
    //.TRANS: musical instrument
    [_("trumpet"), "trumpet", "images/voices.svg", "wind"],
    //.TRANS: musical instrument
    [_("oboe"), "oboe", "images/voices.svg", "wind"],
    //.TRANS: musical instrument
    [_("trombone"), "trombone", "images/voices.svg", "wind"],
    //.TRANS: musical instrument
    [_("banjo"), "banjo", "images/voices.svg", "string"],
    //.TRANS: musical instrument
    [_("koto"), "koto", "images/voices.svg", "string"],
    //.TRANS: musical instrument
    [_("dulcimer"), "dulcimer", "images/voices.svg", "string"],
    //.TRANS: musical instrument
    [_("electric guitar"), "electric guitar", "images/voices.svg", "string"],
    //.TRANS: musical instrument
    [_("bassoon"), "bassoon", "images/voices.svg", "string"],
    //.TRANS: musical instrument
    [_("celeste"), "celeste", "images/voices.svg", "string"],
    //.TRANS: xylophone musical instrument
    [_("xylophone"), "xylophone", "images/8_bellset_key_6.svg", "precussion"],
    //.TRANS: polytone synthesizer
    [_("electronic synth"), "electronic synth", "images/synth.svg", "electronic"],
    //.TRANS: simple monotone synthesizer
    // [_('simple 1'), 'simple 1', 'images/synth.svg', 'electronic'],
    //.TRANS: simple monotone synthesizer
    // [_('simple-2'), 'simple 2', 'images/synth.svg', 'electronic'],
    //.TRANS: simple monotone synthesizer
    // [_('simple-3'), 'simple 3', 'images/synth.svg', 'electronic'],
    //.TRANS: simple monotone synthesizer
    // [_('simple-4'), 'simple 4', 'images/synth.svg', 'electronic'],
    //.TRANS: sine wave
    [_("sine"), "sine", "images/synth.svg", "electronic"],
    //.TRANS: square wave
    [_("square"), "square", "images/synth.svg", "electronic"],
    //.TRANS: sawtooth wave
    [_("sawtooth"), "sawtooth", "images/synth.svg", "electronic"],
    //.TRANS: triangle wave
    [_("triangle"), "triangle", "images/synth.svg", "electronic"],
    //.TRANS: customize voice
    [_("custom"), "custom", "images/synth.svg", "electronic"],
    //.TRANS: vibraphone musical instrument
    [_("vibraphone"), "vibraphone", "images/synth.svg", "electronic"]
];

// drum symbols are from
// http://lilypond.org/doc/v2.18/Documentation/notation/percussion-notes
/**
 * Array of names and details for various drum instruments.
 * @constant
 * @type {Array<Array<string>>}
 */
const DRUMNAMES = [
    //.TRANS: musical instrument
    [_("snare drum"), "snare drum", "images/snaredrum.svg", "sn", "drum"],
    //.TRANS: musical instrument
    [_("kick drum"), "kick drum", "images/kick.svg", "hh", "drum"],
    //.TRANS: musical instrument
    [_("tom tom"), "tom tom", "images/tom.svg", "tomml", "drum"],
    //.TRANS: musical instrument
    [_("floor tom"), "floor tom", "images/floortom.svg", "tomfl", "drum"],
    //.TRANS: musical instrument
    [_("bass drum"), "bass drum", "images/kick.svg", "tomfl", "drum"],
    //.TRANS: a drum made from an inverted cup
    [_("cup drum"), "cup drum", "images/cup.svg", "hh", "drum"],
    //.TRANS: musical instrument
    [_("darbuka drum"), "darbuka drum", "images/darbuka.svg", "hh", "drum"],
    //.TRANS: musical instrument
    [_("taiko"), "japanese drum", "images/tom.svg", "hh", "drum"],
    //.TRANS: musical instrument
    [_("hi hat"), "hi hat", "images/hihat.svg", "hh", "bell"],
    //.TRANS: a small metal bell
    [_("ride bell"), "ride bell", "images/ridebell.svg", "rb", "bell"],
    //.TRANS: musical instrument
    [_("cow bell"), "cow bell", "images/cowbell.svg", "cb", "bell"],
    //.TRANS: musical instrument
    [_("triangle bell"), "triangle bell", "images/trianglebell.svg", "tri", "bell"],
    //.TRANS: musical instrument
    [_("finger cymbals"), "finger cymbals", "images/fingercymbals.svg", "cymca", "bell"],
    //.TRANS: musical instrument
    // [_('japanese bell'), 'japanese bell', 'images/cowbell.svg', 'hh', 'bell'],
    //.TRANS: a musically tuned set of bells
    [_("chime"), "chime", "images/chime.svg", "cymca", "bell"],
    //.TRANS: a musical instrument
    [_("gong"), "gong", "images/gong.svg", "cymca", "bell"],
    //.TRANS: sound effect
    [_("clang"), "clang", "images/clang.svg", "cymca", "effect"],
    //.TRANS: sound effect
    [_("crash"), "crash", "images/crash.svg", "cymca", "effect"],
    //.TRANS: sound effect
    [_("bottle"), "bottle", "images/bottle.svg", "hh", "effect"],
    //.TRANS: sound effect
    [_("clap"), "clap", "images/clap.svg", "hc", "effect"],
    //.TRANS: sound effect
    [_("slap"), "slap", "images/slap.svg", "vibs", "effect"],
    //.TRANS: sound effect
    [_("splash"), "splash", "images/splash.svg", "hh", "effect"],
    //.TRANS: sound effect
    [_("bubbles"), "bubbles", "images/bubbles.svg", "hh", "effect"],
    //.TRANS: sound effect
    [_("raindrop"), "raindrop", "images/bubbles.svg", "hh", "effect"],
    //.TRANS: animal sound effect
    [_("cat"), "cat", "images/cat.svg", "hh", "animal"],
    //.TRANS: animal sound effect
    [_("cricket"), "cricket", "images/cricket.svg", "hh", "animal"],
    //.TRANS: animal sound effect
    [_("dog"), "dog", "images/dog.svg", "hh", "animal"],
    //.TRANS: animal sound effect
    [_("duck"), "duck", "images/duck.svg", "hh", "animal"]
];

/**
 * Array of names for various sound effect presets.
 * @constant
 * @type {Array<string>}
 */
const EFFECTSNAMES = ["duck", "dog", "cricket", "cat", "bubbles", "splash", "bottle"];

/**
 * Array of file paths for different sound samples.
 * @constant
 * @type {Array<string>}
 */
/**
 * Object containing file paths and global variable names for different sound samples.
 * @constant
 * @type {Object}
 */
const SAMPLE_INFO = {
    voice: {
        "piano": { path: "samples/piano", global: "PIANO_SAMPLE" },
        "violin": { path: "samples/violin", global: "VIOLIN_SAMPLE" },
        "viola": { path: "samples/viola", global: "VIOLA_SAMPLE" },
        "double bass": { path: "samples/doublebass", global: "DOUBLEBASS_SAMPLE" },
        "cello": { path: "samples/cello", global: "CELLO_SAMPLE" },
        "flute": { path: "samples/flute", global: "FLUTE_SAMPLE" },
        "clarinet": { path: "samples/clarinet", global: "CLARINET_SAMPLE" },
        "saxophone": { path: "samples/saxophone", global: "SAXOPHONE_SAMPLE" },
        "trumpet": { path: "samples/trumpet", global: "TRUMPET_SAMPLE" },
        "oboe": { path: "samples/oboe", global: "OBOE_SAMPLE" },
        "trombone": { path: "samples/trombone", global: "TROMBONE_SAMPLE" },
        "tuba": { path: "samples/tuba", global: "TUBA_SAMPLE" },
        "guitar": { path: "samples/guitar", global: "GUITAR_SAMPLE" },
        "acoustic guitar": { path: "samples/acguit", global: "ACOUSTIC_GUITAR_SAMPLE" },
        "bass": { path: "samples/bass", global: "BASS_SAMPLE" },
        "banjo": { path: "samples/banjo", global: "BANJO_SAMPLE" },
        "koto": { path: "samples/koto", global: "KOTO_SAMPLE" },
        "dulcimer": { path: "samples/dulcimer", global: "DULCIMER_SAMPLE" },
        "electric guitar": { path: "samples/electricguitar", global: "ELECTRICGUITAR_SAMPLE" },
        "bassoon": { path: "samples/bassoon", global: "BASSOON_SAMPLE" },
        "celeste": { path: "samples/celeste", global: "CELESTE_SAMPLE" },
        "vibraphone": { path: "samples/vibraphone", global: "VIBRAPHONE_SAMPLE" },
        "xylophone": { path: "samples/xylophone", global: "XYLOPHONE_SAMPLE" },
        "sitar": { path: "samples/sitar", global: "SITAR_SAMPLE" },
        "harmonium": { path: "samples/harmonium", global: "HARMONIUM_SAMPLE" },
        "mandolin": { path: "samples/mandolin", global: "MANDOLIN_SAMPLE" }
    },
    drum: {
        "bottle": { path: "samples/bottle", global: "BOTTLE_SAMPLE" },
        "clap": { path: "samples/clap", global: "CLAP_SAMPLE" },
        "darbuka drum": { path: "samples/darbuka", global: "DARBUKA_SAMPLE" },
        "hi hat": { path: "samples/hihat", global: "HIHAT_SAMPLE" },
        "splash": { path: "samples/splash", global: "SPLASH_SAMPLE" },
        "bubbles": { path: "samples/bubbles", global: "BUBBLES_SAMPLE" },
        "raindrop": { path: "samples/raindrop", global: "RAINDROP_SAMPLE" },
        "cow bell": { path: "samples/cowbell", global: "COWBELL_SAMPLE" },
        "dog": { path: "samples/dog", global: "DOG_SAMPLE" },
        "kick drum": { path: "samples/kick", global: "KICK_SAMPLE" },
        "tom tom": { path: "samples/tom", global: "TOM_SAMPLE" },
        "cat": { path: "samples/cat", global: "CAT_SAMPLE" },
        "crash": { path: "samples/crash", global: "CRASH_SAMPLE" },
        "duck": { path: "samples/duck", global: "DUCK_SAMPLE" },
        "ride bell": { path: "samples/ridebell", global: "RIDEBELL_SAMPLE" },
        "triangle bell": { path: "samples/triangle", global: "TRIANGLE_SAMPLE" },
        "chime": { path: "samples/chime", global: "CHIME_SAMPLE" },
        "gong": { path: "samples/gong", global: "GONG_SAMPLE" },
        "cricket": { path: "samples/cricket", global: "CRICKET_SAMPLE" },
        "finger cymbals": { path: "samples/fingercymbal", global: "FINGERCYMBAL_SAMPLE" },
        "slap": { path: "samples/slap", global: "SLAP_SAMPLE" },
        "japanese drum": { path: "samples/japanese_drum", global: "JAPANESE_DRUM_SAMPLE" },
        "clang": { path: "samples/clang", global: "CLANG_SAMPLE" },
        "cup drum": { path: "samples/cup", global: "CUP_SAMPLE" },
        "floor tom": { path: "samples/floortom", global: "FLOORTOM_SAMPLE" },
        "bass drum": { path: "samples/bassdrum", global: "BASSDRUM_SAMPLE" },
        "snare drum": { path: "samples/snare", global: "SNARE_SAMPLE" }
    }
};

/**
 * Array of file paths for different sound samples.
 * @constant
 * @type {Array<string>}
 */
const SOUNDSAMPLESDEFINES = Object.values(SAMPLE_INFO.voice)
    .map(s => s.path)
    .concat(Object.values(SAMPLE_INFO.drum).map(s => s.path));

// Some samples have a default volume other than 50 (See #1697)
/**
 * Default volume settings for different synth instruments.
 * @constant
 * @type {Object.<string, number>}
 */
const DEFAULTSYNTHVOLUME = {
    "flute": 90,
    "electronic synth": 90,
    "piano": 100,
    "viola": 20,
    "violin": 20,
    "banjo": 90,
    "koto": 70,
    "kick drum": 100,
    "tom tom": 100,
    "floor tom": 100,
    "bass drum": 100,
    "cup drum": 100,
    "darbuka drum": 100,
    "hi hat": 100,
    "ride bell": 100,
    "cow bell": 100,
    "triangle bell": 60,
    "finger cymbals": 70,
    "chime": 90,
    "gong": 70,
    "clang": 70,
    "crash": 90,
    "clap": 90,
    "slap": 60,
    "vibraphone": 100,
    "xylophone": 100,
    "japanese drum": 90,
    "sitar": 100,
    "harmonium": 100,
    "mandolin": 100
};

/**
 * The sample has a pitch which is subsequently transposed.
 * This object defines the starting pitch number for different samples.
 * @constant
 * @type {Object.<string, [string, number]>}
 */
const SAMPLECENTERNO = {
    "piano": ["C4", 39], // pitchToNumber('C', 4, 'C Major')],
    "violin": ["C5", 51], // pitchToNumber('C', 5, 'C Major')],
    "cello": ["C3", 27], // pitchToNumber('C', 3, 'C Major')],
    "bass": ["C3", 27], // pitchToNumber('C', 2, 'C Major')],
    "guitar": ["C4", 39], // pitchToNumber('C', 4, 'C Major')],
    "acoustic guitar": ["C4", 39], // pitchToNumber('C', 4, 'C Major')],
    "flute": ["F#5", 57], // pitchToNumber('F#', 57, 'C Major')],
    "saxophone": ["C5", 51], // pitchToNumber('C', 5, 'C Major')],
    "clarinet": ["C4", 39], // pitchToNumber('C', 4, 'C Major')],
    "tuba": ["C4", 39], // pitchToNumber('C', 4, 'C Major')],
    "trumpet": ["C3", 27], // pitchToNumber('C', 3, 'C Major')],
    "oboe": ["C4", 39], // pitchToNumber('C', 3, 'C Major')],
    "trombone": ["C3", 27], // pitchToNumber('C', 3, 'C Major')],
    "banjo": ["C6", 63], // pitchToNumber('C', 6, 'C Major')],
    "koto": ["C5", 51], // pitchToNumber('C', 5, 'C Major')],
    "dulcimer": ["C4", 39], // pitchToNumber('C', 4, 'C Major')],
    "electric guitar": ["C3", 27], // pitchToNumber('C', 3, 'C Major')],
    "bassoon": ["D4", 41], // pitchToNumber('D', 4, 'D Major')],
    "celeste": ["C3", 27], // pitchToNumber('C', 3, 'C Major')],
    "vibraphone": ["C5", 51], // pitchToNumber('C', 5, 'C Major')],
    "xylophone": ["C4", 39], // pitchToNumber('C', 4, 'C Major')],
    "viola": ["D4", 53], // pitchToNumber('D', 4, 'D Major')],
    "double bass": ["C4", 39], // pitchToNumber('C', 4, 'C Major')],
    "sitar": ["C4", 39], // pitchToNumber('C', 4, 'C Major')]
    "harmonium": ["C4", 39] // pitchToNumber('C', 4, 'C Major')]
};

/**
 * The sample has multiple pitch which is subsequently transposed.
 * This object defines the starting pitch for different samples.
 * @constant
 * @type {Object.<string, Array<string>>}
 */
const MULTIPITCH = {
    mandolin: ["A4", "A5", "A6"]
};

/**
 * Array to store custom samples.
 * @constant
 * @type {Array}
 */
const CUSTOMSAMPLES = [];

/**
 * Array of percussion instruments.
 * @constant
 * @type {Array<string>}
 */
const percussionInstruments = ["koto", "banjo", "dulcimer", "xylophone", "celeste"];

/**
 * Array of string instruments.
 * @constant
 * @type {Array<string>}
 */
const stringInstruments = [
    "piano",
    "harmonium",
    "sitar",
    "guitar",
    "acoustic guitar",
    "electric guitar"
];
/**
 * Validates and sets parameters for an instrument.
 * @function
 * @param {Object} defaultParams - The default parameters for the instrument.
 * @param {Object} params - The parameters to be set for the instrument.
 * @returns {Object} - The validated and set parameters.
 */
const validateAndSetParams = (defaultParams, params) => {
    if (defaultParams && defaultParams !== null && params && params !== undefined) {
        for (const key in defaultParams) {
            if (key in params && params[key] !== undefined) defaultParams[key] = params[key];
        }
    }

    return defaultParams;
};

// This object contains mapping between instrument name and
// corresponding synth object.  The instrument name is the one that
// the user sets in the "Timbre" clamp and uses in the "Set Timbre"
// clamp; There is one instrument dictionary per turtle.
/**
 * Object containing mapping between turtle ID and instrument dictionaries.
 * @type {Object.<number, Object>}
 */
const instruments = { 0: {} };

/**
 * Object containing mapping between instrument name and its source.
 * @type {Object.<string, [number, string]>}
 * e.g. instrumentsSource['kick drum'] = [1, 'kick drum']
 */
const instrumentsSource = {};

/**
 * Object containing effects associated with instruments in the timbre widget.
 * @type {Object.<number, Object>}
 */
const instrumentsEffects = { 0: {} };

/**
 * Object containing filters associated with instruments in the timbre widget.
 * @type {Object.<number, Object>}
 */
const instrumentsFilters = { 0: {} };

/**
 * Synth constructor function.
 * @constructor
 */
function Synth() {
    // Isolate synth functions here.
    /**
     * Built-in synth types.
     * @type {Object.<string, number>}
     */
    const BUILTIN_SYNTHS = {
        "sine": 1,
        "triangle": 1,
        "sawtooth": 1,
        "square": 1,
        "pluck": 1,
        "noise1": 1,
        "noise2": 1,
        "noise3": 1,
        "poly": 1,
        "simple 1": 1,
        "simple 2": 1,
        "simple 3": 1,
        "simple 4": 1,
        "custom": 1
    };
    /**
     * Custom synth types.
     * @type {Object.<string, number>}
     */
    const CUSTOM_SYNTHS = {
        amsynth: 1,
        fmsynth: 1,
        duosynth: 1
    };

    // Using Tone.js
    // this.tone = new Tone();
    this.tone = null;

    Tone.Buffer.onload = () => {
        // eslint-disable-next-line no-console
        console.debug("sample loaded");
    };
    /**
     * Object to store samples.
     * @type {Object}
     */
    this.samples = null;
    /**
     * Suffix for sample names.
     * @type {string}
     */
    this.samplesuffix = "_SAMPLE";
    /**
     * Manifest for sample loading.
     * @type {Object}
     */
    this.samplesManifest = null;
    /**
     * Flag to track changes in temperament.
     * @type {boolean}
     */
    this.changeInTemperament = false;
    /**
     * Current temperament.
     * @type {string}
     */
    this.inTemperament = "equal";
    /**
     * Starting pitch note.
     * @type {string}
     */
    this.startingPitch = "C4";
    /**
     * Frequencies of notes in the current temperament.
     * @type {Object.<string, [number, number]>}
     */
    this.noteFrequencies = {};
    /**
     * Tuner microphone input.
     * @type {Tone.UserMedia|null}
     */
    this.tunerMic = null;
    /**
     * Tuner analyser for pitch detection.
     * @type {Tone.Analyser|null}
     */
    this.tunerAnalyser = null;
    /**
     * Pitch detection function.
     * @type {function|null}
     */
    this.detectPitch = null;

    /**
     * Function to initialize a new Tone.js instance.
     * @function
     */
    this.newTone = () => {
        this.tone = Tone;
    };

    /**
     * Function to get the current temperament.
     * @function
     * @returns {string} - The current temperament.
     */
    this.whichTemperament = () => {
        return this.inTemperament;
    };
    /**
     * Function to handle temperament changes.
     * @function
     * @param {string} temperament - The new temperament.
     * @param {string} startingPitch - The starting pitch note.
     */
    this.temperamentChanged = (temperament, startingPitch) => {
        let startPitch = startingPitch;
        const t = getTemperament(temperament);
        const len = startPitch.length;
        const number = pitchToNumber(
            startPitch.substring(0, len - 1),
            startPitch.slice(-1),
            "C major"
        );
        const startPitchObj = numberToPitch(number);
        startPitch = (startPitchObj[0] + startPitchObj[1]).toString();

        if (startPitch.substring(1, len - 1) === FLAT || startPitch.substring(1, len - 1) === "b") {
            startPitch = startPitch.replace(FLAT, "b");
        } else if (
            startPitch.substring(1, len - 1) === SHARP ||
            startPitch.substring(1, len - 1) === "#"
        ) {
            startPitch = startPitch.replace(SHARP, "#");
        }

        const frequency = Tone.Frequency(startPitch).toFrequency();

        // Cache getNoteFromInterval results to avoid duplicate calls (performance optimization)
        const intervalCache = {
            "minor 2": getNoteFromInterval(startingPitch, "minor 2"),
            "augmented 1": getNoteFromInterval(startingPitch, "augmented 1"),
            "major 2": getNoteFromInterval(startingPitch, "major 2"),
            "minor 3": getNoteFromInterval(startingPitch, "minor 3"),
            "augmented 2": getNoteFromInterval(startingPitch, "augmented 2"),
            "major 3": getNoteFromInterval(startingPitch, "major 3"),
            "augmented 3": getNoteFromInterval(startingPitch, "augmented 3"),
            "diminished 4": getNoteFromInterval(startingPitch, "diminished 4"),
            "perfect 4": getNoteFromInterval(startingPitch, "perfect 4"),
            "augmented 4": getNoteFromInterval(startingPitch, "augmented 4"),
            "diminished 5": getNoteFromInterval(startingPitch, "diminished 5"),
            "perfect 5": getNoteFromInterval(startingPitch, "perfect 5"),
            "augmented 5": getNoteFromInterval(startingPitch, "augmented 5"),
            "minor 6": getNoteFromInterval(startingPitch, "minor 6"),
            "major 6": getNoteFromInterval(startingPitch, "major 6"),
            "augmented 6": getNoteFromInterval(startingPitch, "augmented 6"),
            "minor 7": getNoteFromInterval(startingPitch, "minor 7"),
            "major 7": getNoteFromInterval(startingPitch, "major 7"),
            "augmented 7": getNoteFromInterval(startingPitch, "augmented 7"),
            "diminished 8": getNoteFromInterval(startingPitch, "diminished 8"),
            "perfect 8": getNoteFromInterval(startingPitch, "perfect 8")
        };

        this.noteFrequencies = {
            // note: [octave, Frequency]
            [startingPitch.substring(0, len - 1)]: [Number(startingPitch.slice(-1)), frequency],
            [intervalCache["minor 2"][0]]: [intervalCache["minor 2"][1], t["minor 2"] * frequency],
            [intervalCache["augmented 1"][0]]: [
                intervalCache["augmented 1"][1],
                t["augmented 1"] * frequency
            ],
            [intervalCache["major 2"][0]]: [intervalCache["major 2"][1], t["major 2"] * frequency],
            [intervalCache["minor 3"][0]]: [intervalCache["minor 3"][1], t["minor 3"] * frequency],
            [intervalCache["augmented 2"][0]]: [
                intervalCache["augmented 2"][1],
                t["augmented 2"] * frequency
            ],
            [intervalCache["major 3"][0]]: [intervalCache["major 3"][1], t["major 3"] * frequency],
            [intervalCache["augmented 3"][0]]: [
                intervalCache["augmented 3"][1],
                t["augmented 3"] * frequency
            ],
            [intervalCache["diminished 4"][0]]: [
                intervalCache["diminished 4"][1],
                t["diminished 4"] * frequency
            ],
            [intervalCache["perfect 4"][0]]: [
                intervalCache["perfect 4"][1],
                t["perfect 4"] * frequency
            ],
            [intervalCache["augmented 4"][0]]: [
                intervalCache["augmented 4"][1],
                t["augmented 4"] * frequency
            ],
            [intervalCache["diminished 5"][0]]: [
                intervalCache["diminished 5"][1],
                t["diminished 5"] * frequency
            ],
            [intervalCache["perfect 5"][0]]: [
                intervalCache["perfect 5"][1],
                t["perfect 5"] * frequency
            ],
            [intervalCache["augmented 5"][0]]: [
                intervalCache["augmented 5"][1],
                t["augmented 5"] * frequency
            ],
            [intervalCache["minor 6"][0]]: [intervalCache["minor 6"][1], t["minor 6"] * frequency],
            [intervalCache["major 6"][0]]: [intervalCache["major 6"][1], t["major 6"] * frequency],
            [intervalCache["augmented 6"][0]]: [
                intervalCache["augmented 6"][1],
                t["augmented 6"] * frequency
            ],
            [intervalCache["minor 7"][0]]: [intervalCache["minor 7"][1], t["minor 7"] * frequency],
            [intervalCache["major 7"][0]]: [intervalCache["major 7"][1], t["major 7"] * frequency],
            [intervalCache["augmented 7"][0]]: [
                intervalCache["augmented 7"][1],
                t["augmented 7"] * frequency
            ],
            [intervalCache["diminished 8"][0]]: [
                intervalCache["diminished 8"][1],
                t["diminished 8"] * frequency
            ],
            [intervalCache["perfect 8"][0]]: [
                intervalCache["perfect 8"][1],
                t["perfect 8"] * frequency
            ]
        };

        for (const key in this.noteFrequencies) {
            let note;
            if (key.substring(1, key.length) === FLAT || key.substring(1, key.length) === "b") {
                note = key.substring(0, 1) + "" + "b";
                this.noteFrequencies[note] = this.noteFrequencies[key];
                // eslint-disable-next-line no-delete-var
                delete this.noteFrequencies[key];
            } else if (
                key.substring(1, key.length) === SHARP ||
                key.substring(1, key.length) === "#"
            ) {
                note = key.substring(0, 1) + "" + "#";
                this.noteFrequencies[note] = this.noteFrequencies[key];
                // eslint-disable-next-line no-delete-var
                delete this.noteFrequencies[key];
            }
        }

        this.changeInTemperament = false;
    };
    /**
     * Function to get the frequency of notes.
     * @function
     * @param {string|number|string[]} notes - The notes to get frequencies for.
     * @param {boolean} changeInTemperament - Whether there is a change in temperament.
     * @returns {number|number[]} - The frequency or frequencies.
     */
    this.getFrequency = (notes, changeInTemperament) => {
        return this._getFrequency(notes, changeInTemperament);
    };
    /**
     * Internal function to get the frequency of notes.
     * @function
     * @param {string|number|string[]} notes - The notes to get frequencies for.
     * @param {boolean} changeInTemperament - Whether there is a change in temperament.
     * @param {string} temperament - The temperament to use.
     * @returns {number|number[]} - The frequency or frequencies.
     * @private
     */
    this._getFrequency = (notes, changeInTemperament, temperament) => {
        if (changeInTemperament) {
            if (temperament === undefined) {
                this.temperamentChanged(this.inTemperament, this.startingPitch);
            } else {
                //To get frequencies in Temperament Widget.
                this.temperamentChanged(temperament, this.startingPitch);
            }
        }

        if (this.inTemperament === "equal") {
            let len, note, octave;
            if (typeof notes === "string") {
                len = notes.length;
                note = notes.substring(0, len - 1);
                octave = Number(notes.slice(-1));
                return pitchToFrequency(note, octave, 0, "c major");
            } else if (typeof notes === "number") {
                return notes;
            } else {
                const results = [];
                for (let i = 0; i < notes.length; i++) {
                    if (typeof notes[i] === "string") {
                        len = notes[i].length;
                        note = notes[i].substring(0, len - 1);
                        octave = Number(notes[i].slice(-1));
                        results.push(pitchToFrequency(note, octave, 0, "c major"));
                    } else {
                        results.push(notes[i]);
                    }
                }
                return results;
            }
        }

        const __getFrequency = oneNote => {
            const len = oneNote.length;

            for (const note in this.noteFrequencies) {
                if (note === oneNote.substring(0, len - 1)) {
                    if (this.noteFrequencies[note][0] === Number(oneNote.slice(-1))) {
                        //Note to be played is in the same octave.
                        return this.noteFrequencies[note][1];
                    } else {
                        //Note to be played is not in the same octave.
                        const power = Number(oneNote.slice(-1)) - this.noteFrequencies[note][0];
                        return this.noteFrequencies[note][1] * Math.pow(2, power);
                    }
                }
            }
        };

        if (typeof notes === "string") {
            return __getFrequency(notes);
        } else if (typeof notes === "object") {
            const results = [];
            for (let i = 0; i < notes.length; i++) {
                if (typeof notes[i] === "string") {
                    results.push(__getFrequency(notes[i]));
                } else {
                    // Hertz?
                    results.push(notes[i]);
                }
            }

            return results;
        } else {
            // Hertz?
            return notes;
        }
    };
    /**
     * Function to get custom frequency for notes.
     * @function
     * @param {string|number|string[]} notes - The notes to get frequencies for.
     * @param {string} customID - The custom temperament ID.
     * @returns {number|number[]} - The frequency or frequencies.
     */
    this.getCustomFrequency = (notes, customID) => {
        const __getCustomFrequency = (oneNote, startingPitch) => {
            const octave = oneNote.slice(-1);
            oneNote = getCustomNote(oneNote.substring(0, oneNote.length - 1));
            const pitch = startingPitch;
            const startPitchFrequency = pitchToFrequency(
                pitch.substring(0, pitch.length - 1),
                pitch.slice(-1),
                0,
                "C Major"
            );
            if (typeof oneNote !== "number") {
                const thisTemperament = getTemperament(customID);
                for (const pitchNumber in thisTemperament) {
                    if (pitchNumber !== "pitchNumber") {
                        if (
                            (isCustomTemperament(customID) &&
                                oneNote === thisTemperament[pitchNumber][3]) ||
                            oneNote === thisTemperament[pitchNumber][1]
                        ) {
                            const octaveDiff = octave - thisTemperament[pitchNumber][2];
                            return Number(
                                thisTemperament[pitchNumber][0] *
                                    startPitchFrequency *
                                    Math.pow(getOctaveRatio(), octaveDiff)
                            );
                        }
                    }
                }
            }
            return oneNote;
        };

        if (typeof notes === "string") {
            return __getCustomFrequency(notes, this.startingPitch);
        } else if (typeof notes === "object") {
            const results = [];
            for (let i = 0; i < notes.length; i++) {
                if (typeof notes[i] === "string") {
                    results.push(__getCustomFrequency(notes[i], this.startingPitch));
                } else {
                    // Hertz?
                    results.push(notes[i]);
                }
            }
            return results;
        } else {
            // Hertz?
            return notes;
        }
    };

    /**
     * Function to resume the Tone.js context.
     * @function
     */
    this.resume = () => {
        if (this.tone === null) {
            this.newTone();
        }

        this.tone.context.resume();
    };

    /*eslint-disable no-undef*/
    /**
     * Function to load samples.
     * @function
     */
    this.loadSamples = () => {
        /*eslint-disable no-prototype-builtins*/
        if (this.samples === null) {
            this.samples = { voice: {}, drum: {} };
            // Pre-populate with null to indicate they exist as valid instruments but are not loaded
            for (const type in SAMPLE_INFO) {
                for (const name in SAMPLE_INFO[type]) {
                    this.samples[type][name] = null;
                }
            }
            this.samples.voice["empty"] = () => null;
        }
    };

    /**
     * Loads samples into the Synth instance.
     * @function
     * @memberof Synth
     */
    /**
     * Loads a specific sample into the Synth instance asynchronously.
     * @function
     * @memberof Synth
     * @param {string} sampleName - The name of the sample to load.
     * @returns {Promise<void>} - A promise that resolves when the sample is loaded.
     */
    this._loadSample = sampleName => {
        return new Promise((resolve, reject) => {
            let found = false;
            let sampleType = null;
            let sampleInfo = null;

            // Find the sample info
            for (const type in SAMPLE_INFO) {
                if (SAMPLE_INFO[type][sampleName]) {
                    sampleType = type;
                    sampleInfo = SAMPLE_INFO[type][sampleName];
                    found = true;
                    break;
                }
            }

            if (!found) {
                // If not found in SAMPLE_INFO, it might be a built-in or custom synth, so we resolve immediately
                resolve();
                return;
            }

            if (this.samples[sampleType][sampleName] !== null) {
                // Already loaded
                resolve();
                return;
            }

            // Load the sample module using require
            require([sampleInfo.path], () => {
                try {
                    // eslint-disable-next-line no-undef
                    const sampleData = window[sampleInfo.global];
                    if (sampleData) {
                        this.samples[sampleType][sampleName] = sampleData();
                        resolve();
                    } else {
                        console.error(
                            `Global variable ${sampleInfo.global} not found for sample ${sampleName}`
                        );
                        reject(`Sample global not found: ${sampleName}`);
                    }
                } catch (e) {
                    console.error(`Error processing sample ${sampleName}:`, e);
                    reject(e);
                }
            });
        });
    };

    /**
     * Preloads samples used in a project by scanning blocks for instrument names.
     * This should be called when a project is loaded to avoid playback delays.
     * @function
     * @memberof Synth
     * @param {Array} blockList - The list of blocks from the project.
     * @returns {Promise<void>} - A promise that resolves when all samples are preloaded.
     */
    this.preloadProjectSamples = async blockList => {
        if (!blockList || !Array.isArray(blockList)) {
            return;
        }

        const instrumentsToLoad = new Set();

        // Known instrument block names
        const instrumentBlockNames = ["settimbre", "setinstrument", "timbre", "instrument"];

        // Scan blocks for instrument references
        for (const block of blockList) {
            if (!Array.isArray(block) || block.length < 2) continue;

            const blockName = block[1];

            // Check if this is an instrument-setting block
            if (instrumentBlockNames.includes(blockName)) {
                // The instrument name is usually in a connected block
                // Check the connections for potential instrument names
                const connections = block[4];
                if (Array.isArray(connections)) {
                    for (const connIdx of connections) {
                        if (connIdx !== null && blockList[connIdx]) {
                            const connBlock = blockList[connIdx];
                            // Check if it's a text/value block with an instrument name
                            if (Array.isArray(connBlock) && connBlock.length > 1) {
                                const value = connBlock[1];
                                // Check if this value is a known instrument
                                if (typeof value === "string") {
                                    // Check voice samples
                                    if (SAMPLE_INFO.voice && SAMPLE_INFO.voice[value]) {
                                        instrumentsToLoad.add(value);
                                    }
                                    // Check drum samples
                                    if (SAMPLE_INFO.drum && SAMPLE_INFO.drum[value]) {
                                        instrumentsToLoad.add(value);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Also check if the block name itself is an instrument
            if (typeof blockName === "string") {
                if (SAMPLE_INFO.voice && SAMPLE_INFO.voice[blockName]) {
                    instrumentsToLoad.add(blockName);
                }
                if (SAMPLE_INFO.drum && SAMPLE_INFO.drum[blockName]) {
                    instrumentsToLoad.add(blockName);
                }
            }
        }

        // Preload all found instruments in parallel
        if (instrumentsToLoad.size > 0) {
            console.debug(
                `Preloading ${instrumentsToLoad.size} instruments:`,
                Array.from(instrumentsToLoad)
            );
            const loadPromises = Array.from(instrumentsToLoad).map(name =>
                this._loadSample(name).catch(err => {
                    console.warn(`Failed to preload sample ${name}:`, err);
                })
            );
            await Promise.all(loadPromises);
            console.debug("Project samples preloaded successfully");
        }
    };

    /**
     * Array to store samples that need to be loaded at start.
     * @type {Array}
     * @memberof Synth
     */
    this.samplesQueue = []; // Samples that need to be loaded at start.

    // Removed eager loading of all samples
    this.loadSamples(); // Just initialize the structure
    /*
    require(SOUNDSAMPLESDEFINES, () => {
        this.loadSamples();
 
        for (let i = 0; i < this.samplesQueue.length; i++) {
            this.__createSynth(
                0,
                this.samplesQueue[i][0],
                this.samplesQueue[i][1],
                this.samplesQueue[i][2]
            );
        }
    });
    */

    /**
     * Sets up the recorder for the Synth instance.
     * @function
     * @memberof Synth
     */
    this.setupRecorder = () => {
        const cont = Tone.getContext();
        const dest = cont.createMediaStreamDestination();
        let chunks = [];
        const stream = dest.stream;
        if (platform.FF) {
            this.recorder = new MediaRecorder(stream, { type: "audio/wav" });
        } else {
            this.recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        }
        for (const tur in instruments) {
            for (const synth in instruments[tur]) {
                instruments[tur][synth].connect(dest);
            }
        }
        this.recorder.ondataavailable = evt => {
            // console.debug(evt.data);
            if (typeof evt.data === "undefined" || evt.data.size === 0) return;
            chunks.push(evt.data);
        };
        const download = (uri, name) => {
            const link = document.createElement("a");
            link.download = name;
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        this.recorder.onstop = () => {
            if (!chunks.length) return;
            let blob;
            if (platform.FF) {
                blob = new Blob(chunks, { type: "audio/wav" });
            } else {
                blob = new Blob(chunks, { type: "audio/ogg" });
            }
            chunks = [];
            const url = URL.createObjectURL(blob);
            // Prompt the user for the file name
            const fileName = window.prompt("Enter file name", "recording");
            if (fileName) {
                download(url, fileName + (platform.FF ? ".wav" : ".ogg"));
            } else {
                alert("Download cancelled.");
            }
        };
        // this.recorder.start();
        // setTimeout(()=>{this.recorder.stop();},5000);
    };

    /**
     * Retrieves default parameter values for various synthesizers.
     * @function
     * @memberof Synth
     * @param {string} sourceName - The name of the synthesizer.
     * @returns {Object} - Default parameter values for the specified synthesizer.
     */
    this.getDefaultParamValues = sourceName => {
        // sourceName may need to be 'untranslated'
        let sourceNameLC = sourceName.toLowerCase();
        if (getOscillatorTypes(sourceNameLC) !== null) {
            sourceNameLC = getOscillatorTypes(sourceNameLC);
        }

        let synthOptions;
        switch (sourceNameLC) {
            case "amsynth":
                synthOptions = {
                    harmonicity: 1,
                    detune: 0,
                    envelope: {
                        attack: 0.01,
                        decay: 0.01,
                        sustain: 1,
                        release: 0.5
                    },
                    modulation: {
                        type: "square"
                    },
                    modulationEnvelope: {
                        attack: 0.5,
                        decay: 0.001,
                        sustain: 1,
                        release: 0.5
                    }
                };
                break;
            case "fmsynth":
                synthOptions = {
                    harmonicity: 1,
                    modulationIndex: 10,
                    detune: 0,
                    envelope: {
                        attack: 0.01,
                        decay: 0.01,
                        sustain: 1,
                        release: 0.5
                    },
                    modulation: {
                        type: "square"
                    },
                    modulationEnvelope: {
                        attack: 0.5,
                        decay: 0.001,
                        sustain: 1,
                        release: 0.5
                    }
                };
                break;
            case "noise1":
                synthOptions = {
                    noise: {
                        type: "white"
                    },
                    envelope: {
                        attack: 0.005,
                        decay: 0.1,
                        sustain: 1
                    }
                };
                break;
            case "noise2":
                synthOptions = {
                    noise: {
                        type: "brown"
                    },
                    envelope: {
                        attack: 0.005,
                        decay: 0.1,
                        sustain: 1
                    }
                };
                break;
            case "noise3":
                synthOptions = {
                    noise: {
                        type: "pink"
                    },
                    envelope: {
                        attack: 0.005,
                        decay: 0.1,
                        sustain: 1
                    }
                };
                break;
            case "simple 1":
            case "simple 2":
            case "simple 3":
            case "simple 4":
                synthOptions = {
                    oscillator: {
                        type: "sine"
                    },
                    envelope: {
                        attack: 0.03,
                        decay: 0.001,
                        sustain: 1,
                        release: 0.03
                    }
                };
                break;
            case "duosynth":
                synthOptions = {
                    vibratoAmount: 0.5,
                    vibratoRate: 5,
                    harmonicity: 1.5,
                    voice0: {
                        volume: -10,
                        portamento: 0,
                        oscillator: {
                            type: "sine"
                        },
                        filterEnvelope: {
                            attack: 0.01,
                            decay: 0.001,
                            sustain: 1,
                            release: 0.5
                        },
                        envelope: {
                            attack: 0.01,
                            decay: 0.001,
                            sustain: 1,
                            release: 0.5
                        }
                    },
                    voice1: {
                        volume: -10,
                        portamento: 0,
                        oscillator: {
                            type: "sine"
                        },
                        filterEnvelope: {
                            attack: 0.01,
                            decay: 0.001,
                            sustain: 1,
                            release: 0.5
                        },
                        envelope: {
                            attack: 0.01,
                            decay: 0.001,
                            sustain: 1,
                            release: 0.5
                        }
                    }
                };
                break;
            case "sine":
            case "triangle":
            case "square":
            case "sawtooth":
                synthOptions = {
                    oscillator: {
                        type: sourceNameLC
                    },
                    envelope: {
                        attack: 0.03,
                        decay: 0.001,
                        sustain: 1,
                        release: 0.03
                    }
                };
                break;
            case "pluck":
                synthOptions = {
                    attackNoise: 1,
                    dampening: 4000,
                    resonance: 0.9
                };
                break;
            case "poly":
                synthOptions = {
                    polyphony: POLYCOUNT
                };
                break;
            default:
                synthOptions = {};
                break;
        }

        return synthOptions;
    };

    /**
     * Creates the default poly/default/custom synth for the specified turtle.
     * @function
     * @memberof Synth
     * @param {string} turtle - The turtle identifier.
     */
    this.createDefaultSynth = turtle => {
        // eslint-disable-next-line no-console
        console.debug("create default poly/default/custom synth for turtle " + turtle);
        const default_synth = new Tone.PolySynth(Tone.AMSynth, POLYCOUNT).toDestination();
        instruments[turtle]["electronic synth"] = default_synth;
        instrumentsSource["electronic synth"] = [0, "electronic synth"];
        instruments[turtle]["custom"] = default_synth;
        instrumentsSource["custom"] = [0, "custom"];
    };

    /**
     * Creates a synth using existing samples: drums and voices.
     * @function
     * @memberof Synth
     * @param {string} turtle - The turtle identifier.
     * @param {string} instrumentName - The name of the instrument.
     * @param {string} sourceName - The name of the source.
     * @returns {Tone.Sampler|Tone.Player} - The created synth.
     */
    this._createSampleSynth = (turtle, instrumentName, sourceName) => {
        let tempSynth;
        if (sourceName in this.samples.voice) {
            instrumentsSource[instrumentName] = [2, sourceName];
            const noteDict = {};
            if (sourceName in SAMPLECENTERNO) {
                noteDict[SAMPLECENTERNO[sourceName][0]] = this.samples.voice[sourceName];
            } else if (sourceName in MULTIPITCH) {
                for (let i = 0; i < MULTIPITCH[sourceName].length; i++) {
                    noteDict[MULTIPITCH[sourceName][i]] = this.samples.voice[sourceName][i];
                }
                tempSynth = new Tone.Sampler(noteDict);
            } else {
                noteDict["C4"] = this.samples.voice[sourceName];
            }
            tempSynth = new Tone.Sampler(noteDict);
        } else if (sourceName in this.samples.drum) {
            instrumentsSource[instrumentName] = [1, sourceName];
            tempSynth = new Tone.Player(this.samples.drum[sourceName]);
        } else if (sourceName in CUSTOMSAMPLES) {
            instrumentsSource[instrumentName] = [2, sourceName];
            const noteDict = {};
            const params = CUSTOMSAMPLES[sourceName];

            // Get the base center note
            const center = this._parseSampleCenterNo(params[1], params[2]);

            // Check if there's a cent adjustment (stored as the fifth parameter)
            const centAdjustment = params[4] || 0;

            // Store the cent adjustment for later use
            if (centAdjustment !== 0) {
                if (!this.sampleCentAdjustments) {
                    this.sampleCentAdjustments = {};
                }
                this.sampleCentAdjustments[sourceName] = centAdjustment;
            }

            noteDict[center] = params[0];
            tempSynth = new Tone.Sampler(noteDict);
        } else {
            // default drum sample
            instrumentsSource[instrumentName] = [1, "drum"];
            tempSynth = new Tone.Player(this.samples.drum[DEFAULTDRUM]);
        }

        return tempSynth;
    };

    /**
     * Parses solfege notation and octave to determine the pitch number.
     * @function
     * @memberof Synth
     * @param {string} solfege - The solfege notation.
     * @param {number} octave - The octave number.
     * @returns {string} - The pitch number.
     */
    this._parseSampleCenterNo = (solfege, octave) => {
        // const pitchName = "C4";
        const solfegeDict = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, ti: 11 };
        const letterDict = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

        let attr = getArticulation(solfege);
        if (attr === SHARP) {
            attr = 1;
        } else if (attr === FLAT) {
            attr = -1;
        } else if (attr === DOUBLESHARP) {
            attr = 2;
        } else if (attr === DOUBLEFLAT) {
            attr = -2;
        } else {
            attr = 0;
        }

        const fragment = solfege.replace(attr, "");
        let chromaticNumber = 0;
        if (fragment in solfegeDict) {
            chromaticNumber = solfegeDict[fragment];
        } else if (fragment in letterDict) {
            chromaticNumber = letterDict[fragment];
        } else {
            // eslint-disable-next-line no-console
            console.debug("Cannot parse " + fragment);
        }
        const pitchNumber = octave * 12 + chromaticNumber + attr;
        return pitchNumber.toString();
    };

    /**
     * Creates a synth using builtin synths from Tone.js.
     * @function
     * @memberof Synth
     * @param {string} turtle - The turtle identifier.
     * @param {string} instrumentName - The name of the instrument.
     * @param {string} sourceName - The name of the source.
     * @param {Object} params - Additional parameters for synth configuration.
     * @returns {Tone.Synth|Tone.PolySynth|Tone.PluckSynth|Tone.NoiseSynth} - The created synth.
     */
    this._createBuiltinSynth = (turtle, instrumentName, sourceName, params) => {
        let synthOptions, builtin_synth;
        if (sourceName in BUILTIN_SYNTHS) {
            synthOptions = this.getDefaultParamValues(sourceName);
            synthOptions = validateAndSetParams(synthOptions, params);
        }

        switch (sourceName) {
            case "simple 1":
            case "simple 2":
            case "simple 3":
            case "simple 4":
                instrumentsSource[instrumentName] = [3, sourceName];
                // console.debug(sourceName);
                builtin_synth = new Tone.Synth(synthOptions);
                break;
            case "sine":
            case "triangle":
            case "square":
            case "sawtooth":
                instrumentsSource[instrumentName] = [3, sourceName];
                // console.debug(sourceName);
                builtin_synth = new Tone.Synth(synthOptions);
                break;
            case "pluck":
                instrumentsSource[instrumentName] = [3, sourceName];
                // console.debug(sourceName);
                builtin_synth = new Tone.PluckSynth(synthOptions);
                break;
            case "poly":
                instrumentsSource[instrumentName] = [0, "poly"];
                // console.debug("poly");
                builtin_synth = new Tone.PolySynth(Tone.AMSynth, synthOptions.polyphony);
                break;
            case "noise1":
            case "noise2":
            case "noise3":
                instrumentsSource[instrumentName] = [4, sourceName];
                // console.debug(sourceName);
                builtin_synth = new Tone.NoiseSynth(synthOptions);
                break;
            default:
                instrumentsSource[instrumentName] = [0, "poly"];
                // console.debug("poly (default)");
                builtin_synth = new Tone.PolySynth(Tone.AMSynth, POLYCOUNT);
                break;
        }

        return builtin_synth;
    };

    /**
     * Creates a custom synth using Tone.js methods like AMSynth, FMSynth, etc.
     * @function
     * @memberof Synth
     * @param {string} sourceName - The name of the source.
     * @param {Object} params - Additional parameters for synth configuration.
     * @returns {Tone.AMSynth|Tone.FMSynth|Tone.DuoSynth|Tone.PolySynth} - The created custom synth.
     */
    this._createCustomSynth = (sourceName, params) => {
        // Getting parameters for custom synth
        let synthOptions = this.getDefaultParamValues(sourceName);
        synthOptions = validateAndSetParams(synthOptions, params);

        let tempSynth;
        if (sourceName.toLowerCase() === "amsynth") {
            tempSynth = new Tone.AMSynth(synthOptions);
        } else if (sourceName.toLowerCase() === "fmsynth") {
            tempSynth = new Tone.FMSynth(synthOptions);
        } else if (sourceName.toLowerCase() === "duosynth") {
            tempSynth = new Tone.DuoSynth(synthOptions);
        } else {
            tempSynth = new Tone.PolySynth(Tone.AMSynth, POLYCOUNT);
        }

        return tempSynth;
    };

    /**
     * Creates a synth based on the specified parameters, either using samples, built-in synths, or custom synths.
     * @function
     * @memberof Synth
     * @param {string} turtle - The turtle identifier.
     * @param {string} instrumentName - The name of the instrument.
     * @param {string} sourceName - The name of the source.
     * @param {Object} params - Additional parameters for synth configuration.
     */
    this.__createSynth = (turtle, instrumentName, sourceName, params) => {
        // Ensure the structure is initialized
        if (this.samples === null) {
            this.loadSamples();
        }

        // Check if it's an audio sample that needs loading
        let sampleType = null;
        if (sourceName in SAMPLE_INFO.voice) sampleType = "voice";
        else if (sourceName in SAMPLE_INFO.drum) sampleType = "drum";

        // If it's a sample...
        if (sampleType) {
            // If already loaded, proceed synchronously
            if (this.samples[sampleType][sourceName] !== null) {
                this.___createSynth(turtle, instrumentName, sourceName, params);
                return Promise.resolve();
            }

            // If not loaded, load asynchronously (lazy loading)
            return this._loadSample(sourceName)
                .then(() => {
                    this.___createSynth(turtle, instrumentName, sourceName, params);
                })
                .catch(err => {
                    console.error(`Failed to load ${sourceName}:`, err);
                });
        }

        // Not a sample (built-in, custom synth, etc.) - create synchronously
        this.___createSynth(turtle, instrumentName, sourceName, params);
        return Promise.resolve();
    };

    /**
     * Internal implementation of createSynth, called after sample is ensured loaded.
     */
    this.___createSynth = (turtle, instrumentName, sourceName, params) => {
        // this._loadSample(sourceName); // Already loaded by __createSynth wrapper
        if (sourceName in this.samples.voice || sourceName in this.samples.drum) {
            if (!instruments[turtle][instrumentName]) {
                instruments[turtle][instrumentName] = this._createSampleSynth(
                    turtle,
                    instrumentName,
                    sourceName,
                    params
                );
            }
        } else if (sourceName in BUILTIN_SYNTHS) {
            if (instruments[turtle] && instruments[turtle][instrumentName]) {
                delete instruments[turtle][instrumentName];
            }

            if (!instruments[turtle][instrumentName]) {
                instruments[turtle][instrumentName] = this._createBuiltinSynth(
                    turtle,
                    instrumentName,
                    sourceName,
                    params
                );
            }
        } else if (sourceName in CUSTOM_SYNTHS) {
            if (instruments[turtle] && instruments[turtle][instrumentName]) {
                delete instruments[turtle][instrumentName];
            }

            if (!instruments[turtle][instrumentName]) {
                instruments[turtle][instrumentName] = this._createCustomSynth(sourceName, params);
            }

            instrumentsSource[instrumentName] = [0, "poly"];
        } else if (sourceName in CUSTOMSAMPLES) {
            if (instruments[turtle] && instruments[turtle][instrumentName]) {
                delete instruments[turtle][instrumentName];
            }

            if (!instruments[turtle][instrumentName]) {
                instruments[turtle][instrumentName] = this._createSampleSynth(
                    turtle,
                    instrumentName,
                    sourceName,
                    params
                );
            }
        } else {
            if (sourceName.length >= 4) {
                if (sourceName.slice(0, 4) === "http") {
                    instruments[turtle][sourceName] = new Tone.Sampler(sourceName).toDestination();
                    instrumentsSource[instrumentName] = [1, "drum"];
                } else if (sourceName.slice(0, 4) === "file") {
                    instruments[turtle][sourceName] = new Tone.Sampler(sourceName).toDestination();
                    instrumentsSource[instrumentName] = [1, "drum"];
                } else if (sourceName === "drum") {
                    instruments[turtle][sourceName] = this._createSampleSynth(
                        turtle,
                        sourceName,
                        sourceName,
                        null
                    ).toDestination();
                    instrumentsSource[instrumentName] = [1, "drum"];
                }
            }
        }
    };

    /**
     * Creates a synth based on the user's input in the 'Timbre' clamp, handling race conditions with the samples loader.
     * @function
     * @memberof Synth
     * @param {string} turtle - The turtle identifier.
     * @param {string} instrumentName - The name of the instrument.
     * @param {string} sourceName - The name of the source.
     * @param {Object} params - Additional parameters for synth configuration.
     */
    this.createSynth = (turtle, instrumentName, sourceName, params) => {
        // Just call __createSynth which handles on-demand loading
        return this.__createSynth(turtle, instrumentName, sourceName, params);
    };

    /**
     * Loads a synth based on the user's input, creating and setting volume for the specified turtle.
     * @function
     * @memberof Synth
     * @param {string} turtle - The turtle identifier.
     * @param {string} sourceName - The name of the source.
     * @returns {Tone.Instrument|null} - The loaded synth or null if not loaded.
     */
    this.loadSynth = async (turtle, sourceName) => {
        /* eslint-disable */
        if (sourceName.substring(0, 13) === "customsample_") {
            console.debug("loading custom " + sourceName);
        } else {
            console.debug("loading " + sourceName);
        }
        await this.createSynth(turtle, sourceName, sourceName, null);
        this.setVolume(turtle, sourceName, last(Singer.masterVolume));

        if (sourceName in instruments[turtle]) {
            return instruments[turtle][sourceName].toDestination();
        }

        return null;
    };

    /**
     * Perform notes using the provided synth, notes, and parameters for effects and filters.
     * @function
     * @memberof Synth
     * @param {Tone.Instrument} synth - The Tone.js instrument.
     * @param {string|number} notes - The notes to be played or the number of notes.
     * @param {number} beatValue - The duration of each beat.
     * @param {Object|null} paramsEffects - Parameters for effects like vibrato, tremolo, etc.
     * @param {Object|null} paramsFilters - Parameters for filters.
     * @param {boolean} setNote - Indicates whether to set the note on the synth.
     * @param {number} future - The time in the future when the notes should be played.
     */
    this._performNotes = async (
        synth,
        notes,
        beatValue,
        paramsEffects,
        paramsFilters,
        setNote,
        future
    ) => {
        if (this.inTemperament !== "equal" && !isCustomTemperament(this.inTemperament)) {
            if (typeof notes === "number") {
                notes = notes;
            } else {
                const notes1 = notes;
                notes = this._getFrequency(notes, this.changeInTemperament);
                if (notes === undefined) {
                    if (notes1.substring(1, notes1.length - 1) == DOUBLEFLAT) {
                        notes =
                            notes1.substring(0, 1) +
                            "" +
                            "bb" +
                            notes1.substring(notes1.length - 1, notes1.length);
                    } else if (notes1.substring(1, notes1.length - 1) === DOUBLESHARP) {
                        notes =
                            notes1.substring(0, 1) +
                            "" +
                            "x" +
                            notes1.substring(notes1.length - 1, notes1.length);
                    } else {
                        notes = notes1;
                    }
                }
            }
        }

        if (isCustomTemperament(this.inTemperament)) {
            const notes1 = notes;
            if (notes.search("[+]") !== -1 || notes.search("[-]") !== -1) {
                notes = this.getCustomFrequency(notes, this.inTemperament);
            }
            if (notes === undefined || notes === "undefined") {
                notes = notes1;
            }
        }

        let numFilters;
        const temp_filters = [];
        const effectsToDispose = [];

        try {
            if (paramsEffects === null && paramsFilters === null) {
                // See https://github.com/sugarlabs/musicblocks/issues/2951
                try {
                    await Tone.ToneAudioBuffer.loaded();
                    synth.triggerAttackRelease(notes, beatValue, Tone.now() + future);
                } catch (e) {
                    console.debug("Error triggering note:", e);
                }
            } else {
                // Remove the dry path so effects are routed serially, not in parallel
                synth.disconnect(Tone.Destination);
                const chainNodes = [];

                if (paramsFilters !== null && paramsFilters !== undefined) {
                    numFilters = paramsFilters.length; // no. of filters
                    for (let k = 0; k < numFilters; k++) {
                        // filter rolloff has to be added
                        const filterVal = new Tone.Filter(
                            paramsFilters[k].filterFrequency,
                            paramsFilters[k].filterType,
                            paramsFilters[k].filterRolloff
                        );
                        temp_filters.push(filterVal);
                        chainNodes.push(filterVal);
                    }
                }

                let vibrato,
                    tremolo,
                    phaser,
                    distortion,
                    chorus = null;
                let neighbor = null;
                if (paramsEffects !== null && paramsEffects !== undefined) {
                    if (paramsEffects.doVibrato) {
                        vibrato = new Tone.Vibrato(
                            1 / paramsEffects.vibratoFrequency,
                            paramsEffects.vibratoIntensity
                        );
                        chainNodes.push(vibrato);
                        effectsToDispose.push(vibrato);
                    }

                    if (paramsEffects.doDistortion) {
                        distortion = new Tone.Distortion(paramsEffects.distortionAmount);
                        chainNodes.push(distortion);
                    }

                    if (paramsEffects.doTremolo) {
                        tremolo = new Tone.Tremolo({
                            frequency: paramsEffects.tremoloFrequency,
                            depth: paramsEffects.tremoloDepth
                        }).start();

                        chainNodes.push(tremolo);
                        effectsToDispose.push(tremolo);
                    }

                    if (paramsEffects.doPhaser) {
                        phaser = new Tone.Phaser({
                            frequency: paramsEffects.rate,
                            octaves: paramsEffects.octaves,
                            baseFrequency: paramsEffects.baseFrequency
                        });

                        chainNodes.push(phaser);
                        effectsToDispose.push(phaser);
                    }

                    if (paramsEffects.doChorus) {
                        chorus = new Tone.Chorus({
                            frequency: paramsEffects.chorusRate,
                            delayTime: paramsEffects.delayTime,
                            depth: paramsEffects.chorusDepth
                        });

                        chainNodes.push(chorus);
                        effectsToDispose.push(chorus);
                    }

                    if (paramsEffects.doPartials) {
                        // Depending on the synth, the oscillator is found
                        // somewhere else in the synth obj.
                        if (synth.oscillator !== undefined) {
                            synth.oscillator.partials = paramsEffects.partials;
                        } else if (synth.voices !== undefined) {
                            for (let i = 0; i < synth.voices.length; i++) {
                                synth.voices[i].oscillator.partials = paramsEffects.partials;
                            }
                        }
                    }

                    if (paramsEffects.doPortamento) {
                        // Depending on the synth, the oscillator is found
                        // somewhere else in the synth obj.
                        if (synth.oscillator !== undefined) {
                            synth.portamento = paramsEffects.portamento;
                        } else if (synth.voices !== undefined) {
                            for (let i = 0; i < synth.voices.length; i++) {
                                synth.voices[i].portamento = paramsEffects.portamento;
                            }
                        }
                    }

                    if (paramsEffects.doNeighbor) {
                        const firstTwoBeats = paramsEffects["neighborArgBeat"];
                        const finalBeat = paramsEffects["neighborArgCurrentBeat"];

                        // Create an array of start times and durations
                        // for each note.
                        const obj = [];
                        for (let i = 0; i < paramsEffects["neighborArgNote1"].length; i++) {
                            const note1 = paramsEffects["neighborArgNote1"][i]
                                .replace("♯", "#")
                                .replace("♭", "b");
                            const note2 = paramsEffects["neighborArgNote2"][i]
                                .replace("♯", "#")
                                .replace("♭", "b");
                            obj.push(
                                { time: 0, note: note1, duration: firstTwoBeats },
                                { time: firstTwoBeats, note: note2, duration: firstTwoBeats },
                                { time: firstTwoBeats * 2, note: note1, duration: finalBeat }
                            );
                        }

                        neighbor = new Tone.Part((time, value) => {
                            synth.triggerAttackRelease(value.note, value.duration, time);
                        }, obj).start();
                        effectsToDispose.push(neighbor);
                    }
                }

                synth.chain(...chainNodes, Tone.Destination);

                if (!paramsEffects.doNeighbor) {
                    if (setNote !== undefined && setNote) {
                        if (synth.oscillator !== undefined) {
                            synth.setNote(notes);
                        } else if (synth.voices !== undefined) {
                            for (let i = 0; i < synth.voices.length; i++) {
                                synth.voices[i].setNote(notes);
                            }
                        }
                    } else {
                        try {
                            await Tone.ToneAudioBuffer.loaded();
                            synth.triggerAttackRelease(notes, beatValue, Tone.now() + future);
                        } catch (e) {
                            console.debug("Error triggering note:", e);
                        }
                    }
                }

                // Schedule cleanup after the note duration
                setTimeout(() => {
                    try {
                        // Dispose of effects
                        effectsToDispose.forEach(effect => {
                            if (effect && typeof effect.dispose === "function") {
                                effect.dispose();
                            }
                        });

                        // Dispose of filters
                        if (temp_filters.length > 0) {
                            temp_filters.forEach(filter => {
                                if (filter && typeof filter.dispose === "function") {
                                    filter.dispose();
                                }
                            });
                        }
                    } catch (e) {
                        console.debug("Error disposing effects:", e);
                    }
                }, beatValue * 1000);
            }
        } catch (e) {
            console.error("Error in _performNotes:", e);
            // Clean up any created effects/filters on error
            effectsToDispose.forEach(effect => {
                if (effect && typeof effect.dispose === "function") {
                    effect.dispose();
                }
            });
            temp_filters.forEach(filter => {
                if (filter && typeof filter.dispose === "function") {
                    filter.dispose();
                }
            });
        }
    };

    /**
     * Tracks an active audio source node for garbage collection on stop.
     * Handles both Tone.Player instances (drums) and synthesizer voices.
     * @function
     * @memberof Synth
     * @param {number} turtle - The turtle index.
     * @param {Object} audioNode - The audio source node (Tone.Player, Synth, etc.).
     */
    this._trackVoice = (turtle, audioNode) => {
        if (!this.activity || !this.activity.turtles) {
            return;
        }

        try {
            const singer = this.activity.turtles.ithTurtle(turtle).singer;
            if (!singer || !singer.activeVoices) {
                return;
            }

            singer.activeVoices.add(audioNode);
        } catch (e) {
            // Silently fail - tracking is optional
        }
    };

    // Generalised version of 'trigger and 'triggerwitheffects' functions
    /**
     * Triggers notes on a specified turtle with the given parameters.
     * @function
     * @memberof Synth
     * @param {string} turtle - The name of the turtle.
     * @param {string|Array} notes - The notes to be played.
     * @param {number} beatValue - The duration of each beat.
     * @param {string} instrumentName - The name of the instrument.
     * @param {Object|null} paramsEffects - Parameters for effects like vibrato, tremolo, etc.
     * @param {Object|null} paramsFilters - Parameters for filters.
     * @param {boolean} setNote - Indicates whether to set the note on the synth.
     * @param {number} future - The time in the future when the notes should be played.
     */
    this.trigger = async (
        turtle,
        notes,
        beatValue,
        instrumentName,
        paramsEffects,
        paramsFilters,
        setNote,
        future
    ) => {
        // If audio is not running, try to start it
        if (Tone.context.state !== "running") {
            Tone.start().catch(function (e) {
                console.warn("Audio start failed:", e);
            });

            // Set a "Watchdog Timer" (Wait 2 seconds to avoid false positives)
            setTimeout(function () {
                // If it is STILL suspended after 2 seconds, it is definitely blocked
                if (Tone.context.state !== "running" && !window.hasShownAudioWarning) {
                    window.hasShownAudioWarning = true;
                    alert(
                        "⚠️ Sound is disabled!\n\nPlease check your browser settings (Site Settings > Sound) to allow audio for Music Blocks."
                    );
                }
            }, 2000);
        }
        try {
            // Ensure audio context is started
            if (Tone.context.state !== "running") {
                await Tone.start();
            }

            // Effects don't work with sine, sawtooth, et al.
            if (["sine", "sawtooth", "triangle", "square"].includes(instrumentName)) {
                paramsEffects = null;
            } else if (paramsEffects !== null && paramsEffects !== undefined) {
                if (paramsEffects["vibratoIntensity"] !== 0) {
                    paramsEffects.doVibrato = true;
                }

                if (paramsEffects["distortionAmount"] !== 0) {
                    paramsEffects.doDistortion = true;
                }

                if (paramsEffects["tremoloFrequency"] !== 0) {
                    paramsEffects.doTremolo = true;
                }

                if (paramsEffects["rate"] !== 0) {
                    paramsEffects.doPhaser = true;
                }

                if (paramsEffects["chorusRate"] !== 0) {
                    paramsEffects.doChorus = true;
                }

                if (paramsEffects["neighborSynth"]) {
                    paramsEffects.doNeighbor = true;
                }
            }

            let tempNotes = notes;
            let tempSynth = instruments[turtle]["electronic synth"];
            let flag = 0;
            if (instrumentName in instruments[turtle]) {
                tempSynth = instruments[turtle][instrumentName];
                flag = instrumentsSource[instrumentName][0];
                if (flag === 1 || flag === 2) {
                    const sampleName = instrumentsSource[instrumentName][1];

                    // Check if there's a cent adjustment for this sample
                    if (
                        flag === 2 &&
                        this.sampleCentAdjustments &&
                        this.sampleCentAdjustments[sampleName]
                    ) {
                        const centAdjustment = this.sampleCentAdjustments[sampleName];
                        // Apply cent adjustment to playback rate
                        // Formula: playbackRate = 2^(cents/1200)
                        const playbackRate = Math.pow(2, centAdjustment / 1200);
                        if (tempSynth && tempSynth.playbackRate) {
                            tempSynth.playbackRate.value = playbackRate;
                        }
                    }
                }
            }

            // Get note values as per the source of the synth.
            if (future === undefined) {
                future = 0.0;
            }

            // Ensure synth is properly initialized
            if (!tempSynth) {
                console.warn("Synth not initialized, creating default synth");
                this.createDefaultSynth(turtle);
                await this.loadSynth(turtle, instrumentName);
                tempSynth = instruments[turtle][instrumentName];
            }

            switch (flag) {
                case 1: // drum
                    if (
                        instrumentName.slice(0, 4) === "http" ||
                        instrumentName.slice(0, 21) === "data:audio/wav;base64"
                    ) {
                        tempSynth.start(Tone.now() + future);
                        this._trackVoice(turtle, tempSynth);
                    } else if (instrumentName.slice(0, 4) === "file") {
                        tempSynth.start(Tone.now() + future);
                        this._trackVoice(turtle, tempSynth);
                    } else {
                        try {
                            tempSynth.start(Tone.now() + future);
                            this._trackVoice(turtle, tempSynth);
                        } catch (e) {
                            console.debug("Error starting drum synth:", e);
                        }
                    }
                    break;
                case 2: // voice sample
                    this._trackVoice(turtle, tempSynth);
                    await this._performNotes(
                        tempSynth.toDestination(),
                        notes,
                        beatValue,
                        paramsEffects,
                        paramsFilters,
                        setNote,
                        future
                    );
                    break;
                case 3: // builtin synth
                    if (typeof notes === "object") {
                        tempNotes = notes[0];
                    }

                    this._trackVoice(turtle, tempSynth);
                    await this._performNotes(
                        tempSynth.toDestination(),
                        tempNotes,
                        beatValue,
                        paramsEffects,
                        paramsFilters,
                        setNote,
                        future
                    );
                    break;
                case 4:
                    this._trackVoice(turtle, tempSynth);
                    tempSynth.triggerAttackRelease("c2", beatValue, Tone.now() + future);
                    break;
                case 0: // default synth
                default:
                    this._trackVoice(turtle, tempSynth);
                    await this._performNotes(
                        tempSynth.toDestination(),
                        tempNotes,
                        beatValue,
                        paramsEffects,
                        paramsFilters,
                        setNote,
                        future
                    );
                    break;
            }
        } catch (e) {
            console.error("Error in trigger:", e);
        }
    };

    this.startSound = (turtle, instrumentName, note) => {
        const flag = instrumentsSource[instrumentName][0];
        switch (flag) {
            case 1: // drum
                instruments[turtle][instrumentName].start();
                break;
            default:
                instruments[turtle][instrumentName].triggerAttack(note);
                break;
        }
    };

    this.stopSound = (turtle, instrumentName, note) => {
        const flag = instrumentsSource[instrumentName][0];
        switch (flag) {
            case 1: // drum
                instruments[turtle][instrumentName].stop();
                break;
            default:
                if (note == undefined) {
                    instruments[turtle][instrumentName].triggerRelease();
                } else {
                    instruments[turtle][instrumentName].triggerRelease(note);
                }
                break;
        }
    };

    this.loop = (turtle, instrumentName, note, duration, start, bpm, velocity) => {
        const synthA = instruments[turtle][instrumentName];
        const flag = instrumentsSource[instrumentName][0];
        const now = Tone.now();
        const loopA = new Tone.Loop(time => {
            if (flag == 1) {
                this.setVolume(turtle, instrumentName, velocity * 100);
                instruments[turtle][instrumentName].start();
            } else synthA.triggerAttackRelease(note, duration, now + time, velocity);
        }, 60 / bpm).start(start);
        return loopA;
    };

    this.start = () => {
        Tone.Transport.start();
    };

    this.stop = () => {
        Tone.Transport.stop();
    };

    this.rampTo = (turtle, instrumentName, oldVol, volume, rampTime) => {
        // guard invalid UI/programmatic input (audio boundary safety)
        volume = Math.max(0, Math.min(volume, 100));
        if (
            percussionInstruments.includes(instrumentName) ||
            stringInstruments.includes(instrumentName)
        )
            return;

        let nv;
        if (instrumentName in DEFAULTSYNTHVOLUME) {
            const sv = DEFAULTSYNTHVOLUME[instrumentName];
            if (volume > 50) {
                const d = 100 - sv;
                nv = ((volume - 50) / 50) * d + sv;
            } else {
                nv = (volume / 50) * sv;
            }
        } else {
            nv = volume;
        }

        const gain = Math.max(0.0001, nv / 100);
        const db = Tone.gainToDb(gain);

        let synth = instruments[turtle]["electronic synth"];
        if (instrumentName in instruments[turtle]) {
            synth = instruments[turtle][instrumentName];
        }

        // eslint-disable-next-line no-console
        console.debug(
            "Crescendo(decibels)",
            instrumentName,
            ":",
            synth.volume.value,
            "to",
            db,
            "t:",
            rampTime
        );
        // eslint-disable-next-line no-console
        console.debug("Crescendo", instrumentName, ":", oldVol, "to", volume, "t:", rampTime);

        synth.volume.linearRampToValueAtTime(db, Tone.now() + rampTime);
    };

    /**
     * new Addtion
     * Gets the volume for a specific instrument.
     * @param {string} turtle - The name of the turtle (e.g., "turtle1").
     * @param {string} instrumentName - The name of the instrument (e.g., "flute").
     * @returns {number} The volume level in decibels or 50 if not found.
     */
    this.getVolume = (turtle, instrumentName) => {
        if (instruments[turtle] && instruments[turtle][instrumentName]) {
            return instruments[turtle][instrumentName].volume.value;
        }
        console.debug("instrument not found");
        return 50; // Default volume
    };

    /**
     * Sets the volume of a specific instrument for a given turtle.
     * @function
     * @memberof Synth
     * @param {string} turtle - The name of the turtle.
     * @param {string} instrumentName - The name of the instrument.
     * @param {number} volume - The volume level (0 to 100).
     */
    this.setVolume = (turtle, instrumentName, volume) => {
        // guard invalid UI/programmatic input (audio boundary safety)
        volume = Math.max(0, Math.min(volume, 100));
        // We pass in volume as a number from 0 to 100.
        // As per #1697, we adjust the volume of some instruments.
        let nv;
        if (instrumentName in DEFAULTSYNTHVOLUME) {
            const sv = DEFAULTSYNTHVOLUME[instrumentName];
            if (volume > 50) {
                const d = 100 - sv;
                nv = ((volume - 50) / 50) * d + sv;
            } else {
                nv = (volume / 50) * sv;
            }
        } else {
            nv = volume;
        }

        const gain = Math.max(0.0001, nv / 100);
        const db = Tone.gainToDb(gain);
        if (instrumentName in instruments[turtle]) {
            const synth = instruments[turtle][instrumentName];
            // Do not schedule a ramp if volume didn't actually change to avoid "flutter" buzz
            if (Math.abs(synth.volume.value - db) < 0.001) return;

            // Use a tiny ramp (10ms) to prevent clicks
            const now = Tone.now();
            synth.volume.cancelScheduledValues(now);
            synth.volume.setValueAtTime(synth.volume.value, now);
            synth.volume.linearRampToValueAtTime(db, now + 0.01);
        }
    };

    /**
     * Sets the master volume for all instruments.
     * @function
     * @memberof Synth
     * @param {number} volume - The master volume level (0 to 100).
     */
    this.setMasterVolume = (volume, firstConnection, lastConnection) => {
        if (!instruments[0]["electronic synth"]) {
            this.createDefaultSynth(0);
        }

        if (firstConnection === null && lastConnection === null) {
            // Reset volume to default (0 dB) first
            Tone.Destination.volume.rampTo(0, 0.01);
            this.setVolume(0, "electronic synth", volume);
            setTimeout(() => {
                this.trigger(0, "G4", 1 / 4, "electronic synth", null, null, false);
            }, 200);
        } else {
            // guard invalid UI/programmatic input (audio boundary safety)
            volume = Math.max(0, Math.min(volume, 100));
            const gain = Math.max(0.0001, volume / 100);
            const db = Tone.gainToDb(gain);
            Tone.Destination.volume.rampTo(db, 0.01);
        }
    };

    /**
     * Starts Recording
     * @function
     * @memberof Synth
     */
    this.startRecording = async () => {
        await Tone.start();
        this.mic = new Tone.UserMedia();
        this.recorder = new Tone.Recorder();
        await this.mic
            .open()
            .then(() => {
                this.mic.connect(this.recorder);
                this.recorder.start();
            })
            .catch(error => {
                console.error(error);
            });
    };

    /**
     * Stops Recording
     * @function
     * @memberof Synth
     */
    this.stopRecording = async () => {
        this.recording = await this.recorder.stop();
        this.mic.close();
        this.audioURL = URL.createObjectURL(this.recording);
        return this.audioURL;
    };

    /**
     * Plays Recording
     * @function
     * @memberof Synth
     */
    this.playRecording = async () => {
        this.player = new Tone.Player().toDestination();
        await this.player.load(this.audioURL);
        this.player.start();
    };

    /**
     * Stops Recording
     * @function
     * @memberof Synth
     */
    this.stopPlayBackRecording = () => {
        this.player.stop();
    };

    /**
     * Analyzing the audio
     * @function
     * @memberof Synth
     */
    this.LiveWaveForm = () => {
        this.analyser = new Tone.Analyser("waveform", 8192);
        this.mic.connect(this.analyser);
    };

    /**
     * Gets real-time waveform values
     * @function
     * @memberof Synth
     */
    this.getWaveFormValues = () => {
        const values = this.analyser.getValue();
        return values;
    };

    /**
     * Starts the tuner by initializing microphone input
     * @returns {Promise<void>}
     */
    this.startTuner = async () => {
        // Initialize required components for pie menu
        if (!window.activity) {
            window.activity = {
                blocks: {
                    blockList: [],
                    setPitchOctave: () => {},
                    findPitchOctave: () => 4,
                    stageClick: false
                },
                logo: {
                    synth: this
                },
                canvas: document.createElement("canvas"),
                blocksContainer: { x: 0, y: 0 },
                getStageScale: () => 1,
                KeySignatureEnv: ["A", "major", false]
            };
        }

        // Initialize wheelnav if not already done
        if (typeof wheelnav !== "function") {
            console.warn("Wheelnav library not found, attempting to load it");
            // Try to load wheelnav dynamically
            const wheelnavScript = document.createElement("script");
            wheelnavScript.src = "lib/wheelnav/wheelnav.min.js";
            document.head.appendChild(wheelnavScript);

            // Wait for wheelnav to load
            await new Promise(resolve => {
                wheelnavScript.onload = resolve;
            });
        }

        // Initialize Raphael if not already done (required by wheelnav)
        if (typeof Raphael !== "function") {
            console.warn("Raphael library not found, attempting to load it");
            // Try to load Raphael dynamically
            const raphaelScript = document.createElement("script");
            raphaelScript.src = "lib/raphael.min.js";
            document.head.appendChild(raphaelScript);

            // Wait for Raphael to load
            await new Promise(resolve => {
                raphaelScript.onload = resolve;
            });
        }

        // Start audio context
        await Tone.start();

        // Initialize synth for preview
        if (!instruments[0]) {
            instruments[0] = {};
        }
        if (!instruments[0]["electronic synth"]) {
            this.createDefaultSynth(0);
            await this.loadSynth(0, "electronic synth");
            this.setVolume(0, "electronic synth", 50); // Set to 50% volume
        }

        // Rest of the tuner initialization code
        if (this.tunerMic) {
            this.tunerMic.close();
        }

        await Tone.start();
        this.tunerMic = new Tone.UserMedia();
        await this.tunerMic.open();

        this.tunerAnalyser = new Tone.Analyser("waveform", 2048);
        this.tunerMic.connect(this.tunerAnalyser);

        const YIN = (sampleRate, bufferSize = 2048, threshold = 0.1) => {
            // Low-Pass Filter to remove high-frequency noise
            const lowPassFilter = (buffer, cutoff = 500) => {
                const alpha = (2 * Math.PI * cutoff) / sampleRate;
                return buffer.map((sample, i, arr) =>
                    i > 0 ? alpha * sample + (1 - alpha) * arr[i - 1] : sample
                );
            };

            // Autocorrelation Function
            const autocorrelation = buffer =>
                buffer.map((_, lag) =>
                    buffer
                        .slice(0, buffer.length - lag)
                        .reduce((sum, value, index) => sum + value * buffer[index + lag], 0)
                );

            // Difference Function
            const difference = buffer => {
                const autocorr = autocorrelation(buffer);
                return autocorr.map((_, tau) => autocorr[0] + autocorr[tau] - 2 * autocorr[tau]);
            };

            // Cumulative Mean Normalized Difference Function
            const cumulativeMeanNormalizedDifference = diff => {
                let runningSum = 0;
                return diff.map((value, tau) => {
                    runningSum += value;
                    return tau === 0 ? 1 : value / (runningSum / tau);
                });
            };

            // Absolute Threshold Function
            const absoluteThreshold = cmnDiff => {
                for (let tau = 2; tau < cmnDiff.length; tau++) {
                    if (cmnDiff[tau] < threshold) {
                        while (tau + 1 < cmnDiff.length && cmnDiff[tau + 1] < cmnDiff[tau]) {
                            tau++;
                        }
                        return tau;
                    }
                }
                return -1;
            };

            // Parabolic Interpolation (More precision)
            const parabolicInterpolation = (cmnDiff, tau) => {
                const x0 = tau < 1 ? tau : tau - 1;
                const x2 = tau + 1 < cmnDiff.length ? tau + 1 : tau;

                if (x0 === tau) return cmnDiff[tau] <= cmnDiff[x2] ? tau : x2;
                if (x2 === tau) return cmnDiff[tau] <= cmnDiff[x0] ? tau : x0;

                const s0 = cmnDiff[x0],
                    s1 = cmnDiff[tau],
                    s2 = cmnDiff[x2];
                const adjustment = ((x2 - x0) * (s0 - s2)) / (2 * (s0 - 2 * s1 + s2));

                return tau + adjustment;
            };

            // Main Pitch Detection Function
            return buffer => {
                buffer = lowPassFilter(buffer, 300);
                const diff = difference(buffer);
                const cmnDiff = cumulativeMeanNormalizedDifference(diff);
                const tau = absoluteThreshold(cmnDiff);

                if (tau === -1) return -1;

                const tauInterp = parabolicInterpolation(cmnDiff, tau);
                return sampleRate / tauInterp;
            };
        };

        this.detectPitch = YIN(Tone.context.sampleRate);
        let tunerMode = "chromatic"; // Add mode state
        let targetPitch = { note: "A4", frequency: 440 }; // Default target pitch

        const updatePitch = () => {
            const buffer = this.tunerAnalyser.getValue();
            const pitch = this.detectPitch(buffer);

            if (pitch > 0) {
                let note, cents;

                // Get the current note being played
                const currentNote = frequencyToNote(pitch);

                if (tunerMode === "chromatic") {
                    // Chromatic mode - use nearest note
                    note = currentNote.note;
                    cents = currentNote.cents;
                } else {
                    // Target pitch mode
                    // Show current note in display but calculate cents from target
                    note = currentNote.note; // Show the current note being played

                    // Ensure we have valid frequencies before calculation
                    if (pitch > 0 && targetPitch.frequency > 0) {
                        // Calculate cents from target frequency
                        const centsFromTarget = 1200 * Math.log2(pitch / targetPitch.frequency);

                        // Calculate octaves and semitones when far off
                        const totalSemitones = Math.round(centsFromTarget / 100);
                        const octaves = Math.floor(Math.abs(totalSemitones) / 12);
                        const remainingSemitones = Math.abs(totalSemitones) % 12;

                        if (Math.abs(centsFromTarget) >= 100) {
                            // More than a semitone off - show octaves and semitones
                            const direction = centsFromTarget > 0 ? "+" : "-";
                            cents = Math.round(centsFromTarget);

                            // Store the display text for the grey text display
                            let displayText = direction;
                            if (octaves > 0) {
                                displayText += octaves + " octave" + (octaves > 1 ? "s" : "");
                                if (remainingSemitones > 0) displayText += " ";
                            }
                            if (remainingSemitones > 0) {
                                displayText +=
                                    remainingSemitones +
                                    " semitone" +
                                    (remainingSemitones > 1 ? "s" : "");
                            }
                            this.displayText = displayText;
                        } else {
                            // Less than a semitone off - show cents
                            cents = Math.round(centsFromTarget);
                            this.displayText = `${cents > 0 ? "+" : ""}${cents} cents`;
                        }
                    } else {
                        // If we don't have valid frequencies, set defaults
                        cents = 0;
                        this.displayText = "0 cents";
                    }
                }

                // Initialize display elements if they don't exist
                let noteDisplayContainer = document.getElementById("noteDisplayContainer");
                const tunerContainer = document.getElementById("tunerContainer");

                if (!noteDisplayContainer && tunerContainer) {
                    // Create container
                    noteDisplayContainer = document.createElement("div");
                    noteDisplayContainer.id = "noteDisplayContainer";
                    noteDisplayContainer.style.position = "absolute";
                    noteDisplayContainer.style.top = "62%";
                    noteDisplayContainer.style.left = "50%";
                    noteDisplayContainer.style.transform = "translate(-50%, -50%)";
                    noteDisplayContainer.style.textAlign = "center";
                    noteDisplayContainer.style.fontFamily = "Arial, sans-serif";
                    noteDisplayContainer.style.zIndex = "1000";

                    // Create target note selector (only for target mode)
                    const targetNoteSelector = document.createElement("div");
                    targetNoteSelector.id = "targetNoteSelector";
                    targetNoteSelector.style.position = "absolute";
                    targetNoteSelector.style.top = "-40px"; // Moved down from -60px
                    targetNoteSelector.style.left = "50%";
                    targetNoteSelector.style.transform = "translateX(-50%)";
                    targetNoteSelector.style.color = "#666666";
                    targetNoteSelector.style.fontSize = "24px"; // Increased from 16px
                    targetNoteSelector.style.cursor = "pointer";
                    targetNoteSelector.style.transition = "opacity 0.2s ease";
                    targetNoteSelector.style.opacity = "0.7";
                    targetNoteSelector.textContent = targetPitch.note;

                    // Hover effects
                    targetNoteSelector.addEventListener("mouseenter", () => {
                        targetNoteSelector.style.opacity = "1";
                    });

                    targetNoteSelector.addEventListener("mouseleave", () => {
                        targetNoteSelector.style.opacity = "0.7";
                    });

                    // Create the wheel div if it doesn't exist
                    let wheelDiv = docById("wheelDiv");
                    if (!wheelDiv) {
                        wheelDiv = document.createElement("div");
                        wheelDiv.id = "wheelDiv";
                        wheelDiv.style.position = "absolute";
                        wheelDiv.style.display = "none";
                        wheelDiv.style.zIndex = "1500";
                        document.body.appendChild(wheelDiv);
                    }

                    // Click handler to open pie menu
                    targetNoteSelector.addEventListener("click", () => {
                        // Only show in target mode
                        if (tunerMode === "target") {
                            // Setup parameters for piemenuPitches
                            const SOLFNOTES = ["ti", "la", "sol", "fa", "mi", "re", "do"];
                            const NOTENOTES = ["B", "A", "G", "F", "E", "D", "C"];
                            const SOLFATTRS = ["𝄪", "♯", "♮", "♭", "𝄫"];

                            // Get current note and accidental
                            let selectedNote = targetPitch.note[0];
                            let selectedAttr =
                                targetPitch.note.length > 1 ? targetPitch.note.substring(1) : "♮";

                            // Convert letter note to solfege for initial selection
                            let selectedSolfege = SOLFNOTES[NOTENOTES.indexOf(selectedNote)];

                            if (selectedAttr === "") {
                                selectedAttr = "♮";
                            }

                            try {
                                // Create a temporary block object to use with piemenuPitches
                                const tempBlock = {
                                    container: {
                                        x: targetNoteSelector.offsetLeft,
                                        y: targetNoteSelector.offsetTop
                                    },
                                    activity: window.activity,
                                    blocks: {
                                        blockList: [
                                            {
                                                name: "pitch",
                                                connections: [null, null],
                                                value: targetPitch.note,
                                                container: {
                                                    x: targetNoteSelector.offsetLeft,
                                                    y: targetNoteSelector.offsetTop
                                                }
                                            }
                                        ],
                                        stageClick: false,
                                        setPitchOctave: () => {},
                                        findPitchOctave: () => 4,
                                        turtles: {
                                            _canvas: {
                                                width: window.innerWidth,
                                                height: window.innerHeight
                                            },
                                            ithTurtle: i => ({
                                                singer: {
                                                    instrumentNames: ["default"]
                                                }
                                            })
                                        }
                                    },
                                    connections: [0], // Connect to the pitch block
                                    value: targetPitch.note,
                                    text: { text: targetPitch.note },
                                    updateCache: () => {},
                                    _exitWheel: null,
                                    _pitchWheel: null,
                                    _accidentalsWheel: null,
                                    _octavesWheel: null,
                                    piemenuOKtoLaunch: () => true,
                                    _piemenuExitTime: 0,
                                    container: {
                                        x: targetNoteSelector.offsetLeft,
                                        y: targetNoteSelector.offsetTop,
                                        setChildIndex: () => {}
                                    },
                                    prevAccidental: "♮",
                                    name: "pitch", // This is needed for pitch preview
                                    _triggerLock: false // This is needed for pitch preview
                                };

                                // Add required activity properties for preview
                                if (!window.activity.logo) {
                                    window.activity.logo = {
                                        synth: {
                                            createDefaultSynth: () => {},
                                            loadSynth: () => {},
                                            setMasterVolume: () => {},
                                            trigger: (turtle, note, duration, instrument) => {
                                                // Use the Web Audio API to play the preview note
                                                const audioContext = new (window.AudioContext ||
                                                    window.webkitAudioContext)();
                                                const oscillator = audioContext.createOscillator();
                                                const gainNode = audioContext.createGain();

                                                oscillator.connect(gainNode);
                                                gainNode.connect(audioContext.destination);

                                                // Convert note to frequency
                                                const freq = pitchToFrequency(note[0], "equal");
                                                oscillator.frequency.value = freq;

                                                // Set volume
                                                gainNode.gain.value = 0.1; // Low volume for preview

                                                // Schedule note
                                                oscillator.start();
                                                gainNode.gain.setValueAtTime(
                                                    0.1,
                                                    audioContext.currentTime
                                                );
                                                gainNode.gain.linearRampToValueAtTime(
                                                    0,
                                                    audioContext.currentTime + duration
                                                );
                                                oscillator.stop(
                                                    audioContext.currentTime + duration
                                                );
                                            },
                                            inTemperament: "equal"
                                        },
                                        errorMsg: msg => {
                                            console.warn(msg);
                                        }
                                    };
                                }

                                // Add key signature environment
                                window.activity.KeySignatureEnv = ["C", "major", false];

                                // Make sure wheelDiv is properly positioned and visible
                                const wheelDiv = docById("wheelDiv");
                                if (wheelDiv) {
                                    const rect = targetNoteSelector.getBoundingClientRect();
                                    wheelDiv.style.position = "absolute";
                                    wheelDiv.style.left = rect.left - 250 + "px";
                                    wheelDiv.style.top = rect.top - 250 + "px";
                                    wheelDiv.style.width = "600px";
                                    wheelDiv.style.height = "600px";
                                    wheelDiv.style.zIndex = "1500";
                                    wheelDiv.style.backgroundColor = "transparent";
                                    wheelDiv.style.display = "block";
                                }

                                // Call piemenuPitches with solfege labels but note values
                                piemenuPitches(
                                    tempBlock,
                                    SOLFNOTES,
                                    NOTENOTES,
                                    SOLFATTRS,
                                    selectedSolfege,
                                    selectedAttr
                                );

                                // Create a state object to track selections
                                const selectionState = {
                                    note: selectedNote,
                                    accidental: selectedAttr,
                                    octave: 4
                                };

                                // Update target pitch when a note is selected
                                if (tempBlock._pitchWheel && tempBlock._pitchWheel.navItems) {
                                    // Add navigation function to each note in the pitch wheel
                                    for (
                                        let i = 0;
                                        i < tempBlock._pitchWheel.navItems.length;
                                        i++
                                    ) {
                                        tempBlock._pitchWheel.navItems[i].navigateFunction = () => {
                                            // Get the selected note
                                            const solfegeNote =
                                                tempBlock._pitchWheel.navItems[i].title;
                                            if (solfegeNote && SOLFNOTES.includes(solfegeNote)) {
                                                const noteIndex = SOLFNOTES.indexOf(solfegeNote);
                                                selectionState.note = NOTENOTES[noteIndex];
                                                updateTargetNote();
                                            }
                                        };
                                    }
                                }

                                // Add handlers for accidentals wheel
                                if (
                                    tempBlock._accidentalsWheel &&
                                    tempBlock._accidentalsWheel.navItems
                                ) {
                                    for (
                                        let i = 0;
                                        i < tempBlock._accidentalsWheel.navItems.length;
                                        i++
                                    ) {
                                        tempBlock._accidentalsWheel.navItems[i].navigateFunction =
                                            () => {
                                                selectionState.accidental =
                                                    tempBlock._accidentalsWheel.navItems[i].title;
                                                updateTargetNote();
                                            };
                                    }
                                }

                                // Add handlers for octaves wheel
                                if (tempBlock._octavesWheel && tempBlock._octavesWheel.navItems) {
                                    for (
                                        let i = 0;
                                        i < tempBlock._octavesWheel.navItems.length;
                                        i++
                                    ) {
                                        tempBlock._octavesWheel.navItems[i].navigateFunction =
                                            () => {
                                                const octave =
                                                    tempBlock._octavesWheel.navItems[i].title;
                                                if (octave && !isNaN(octave)) {
                                                    selectionState.octave = parseInt(octave);
                                                    updateTargetNote();
                                                }
                                            };
                                    }
                                }

                                // Function to update the target note display
                                const updateTargetNote = () => {
                                    if (!selectionState.note) return;

                                    // Convert accidental symbols to notation
                                    let noteWithAccidental = selectionState.note;
                                    if (selectionState.accidental === "♯")
                                        noteWithAccidental += "#";
                                    else if (selectionState.accidental === "♭")
                                        noteWithAccidental += "b";
                                    else if (selectionState.accidental === "𝄪")
                                        noteWithAccidental += "##";
                                    else if (selectionState.accidental === "𝄫")
                                        noteWithAccidental += "bb";

                                    const noteWithOctave =
                                        noteWithAccidental + selectionState.octave;

                                    // Update target pitch
                                    targetPitch.note = noteWithOctave;

                                    // Calculate the frequency for the target pitch
                                    try {
                                        // Define base frequencies for each note (C4 = 261.63 Hz)
                                        const baseFrequencies = {
                                            "C": 261.63,
                                            "C#": 277.18,
                                            "D": 293.66,
                                            "D#": 311.13,
                                            "E": 329.63,
                                            "F": 349.23,
                                            "F#": 369.99,
                                            "G": 392.0,
                                            "G#": 415.3,
                                            "A": 440.0,
                                            "A#": 466.16,
                                            "B": 493.88
                                        };

                                        // Extract note and octave
                                        const noteMatch = noteWithOctave.match(/([A-G][#b]?)(\d+)/);
                                        if (!noteMatch) {
                                            throw new Error("Invalid note format");
                                        }

                                        const [, note, octave] = noteMatch;
                                        // Convert flats to sharps for lookup
                                        const lookupNote = note
                                            .replace("b", "#")
                                            .replace("bb", "##");

                                        // Get base frequency for the note
                                        let freq = baseFrequencies[lookupNote];
                                        if (!freq) {
                                            throw new Error("Invalid note");
                                        }

                                        // Adjust for octave (C4 is the reference octave)
                                        const octaveDiff = parseInt(octave) - 4;
                                        freq *= Math.pow(2, octaveDiff);

                                        targetPitch.frequency = freq;

                                        // Validate frequency
                                        if (
                                            isNaN(targetPitch.frequency) ||
                                            targetPitch.frequency <= 0
                                        ) {
                                            console.error(
                                                "Invalid frequency calculated:",
                                                targetPitch.frequency
                                            );
                                            targetPitch.frequency = 440; // Default to A4 if calculation fails
                                        }
                                    } catch (error) {
                                        console.error("Error calculating frequency:", error);
                                        targetPitch.frequency = 440; // Default to A4 if calculation fails
                                    }

                                    // Update display
                                    targetNoteSelector.textContent = noteWithOctave;
                                };

                                // Update exit wheel handler
                                if (tempBlock._exitWheel && tempBlock._exitWheel.navItems) {
                                    tempBlock._exitWheel.navItems[0].navigateFunction = () => {
                                        // Clean up the wheels
                                        if (tempBlock._pitchWheel) {
                                            tempBlock._pitchWheel.removeWheel();
                                        }
                                        if (tempBlock._accidentalsWheel) {
                                            tempBlock._accidentalsWheel.removeWheel();
                                        }
                                        if (tempBlock._octavesWheel) {
                                            tempBlock._octavesWheel.removeWheel();
                                        }
                                        if (tempBlock._exitWheel) {
                                            tempBlock._exitWheel.removeWheel();
                                        }

                                        // Hide the wheel div
                                        wheelDiv.style.display = "none";
                                    };
                                }
                            } catch (error) {
                                console.error("Error opening pie menu:", error);
                            }
                        }
                    });

                    noteDisplayContainer.appendChild(targetNoteSelector);

                    // Create mode toggle button
                    const modeToggle = document.createElement("div");
                    modeToggle.id = "modeToggle";
                    modeToggle.style.position = "absolute";
                    modeToggle.style.top = "30px";
                    modeToggle.style.left = "50%";
                    modeToggle.style.transform = "translateX(-50%)";
                    modeToggle.style.display = "flex";
                    modeToggle.style.backgroundColor = "#FFFFFF";
                    modeToggle.style.borderRadius = "25px"; // Increased pill shape radius
                    modeToggle.style.padding = "3px"; // Slightly more padding
                    modeToggle.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                    modeToggle.style.width = "120px"; // Increased width
                    modeToggle.style.height = "44px"; // Increased height
                    modeToggle.style.cursor = "pointer"; // Added cursor pointer

                    // Create chromatic mode button
                    const chromaticButton = document.createElement("div");
                    chromaticButton.style.flex = "1";
                    chromaticButton.style.display = "flex";
                    chromaticButton.style.alignItems = "center";
                    chromaticButton.style.justifyContent = "center";
                    chromaticButton.style.borderRadius = "22px"; // Increased radius
                    chromaticButton.style.cursor = "pointer";
                    chromaticButton.style.transition = "all 0.2s ease"; // Faster transition
                    chromaticButton.style.userSelect = "none"; // Prevent text selection
                    chromaticButton.title = "Chromatic";

                    // Create target pitch mode button
                    const targetPitchButton = document.createElement("div");
                    targetPitchButton.style.flex = "1";
                    targetPitchButton.style.display = "flex";
                    targetPitchButton.style.alignItems = "center";
                    targetPitchButton.style.justifyContent = "center";
                    targetPitchButton.style.borderRadius = "22px"; // Increased radius
                    targetPitchButton.style.cursor = "pointer";
                    targetPitchButton.style.transition = "all 0.2s ease"; // Faster transition
                    targetPitchButton.style.userSelect = "none"; // Prevent text selection
                    targetPitchButton.title = "Target pitch";

                    // Create icons
                    const chromaticIcon = document.createElement("img");
                    chromaticIcon.src = "header-icons/chromatic-mode.svg";
                    chromaticIcon.style.width = "32px"; // Increased icon size further
                    chromaticIcon.style.height = "32px";
                    chromaticIcon.style.filter = "brightness(0)"; // Make icon black
                    chromaticIcon.style.pointerEvents = "none"; // Prevent icon from interfering with clicks

                    const targetIcon = document.createElement("img");
                    targetIcon.src = "header-icons/target-pitch-mode.svg";
                    targetIcon.style.width = "32px"; // Increased icon size further
                    targetIcon.style.height = "32px";
                    targetIcon.style.filter = "brightness(0)"; // Make icon black
                    targetIcon.style.pointerEvents = "none"; // Prevent icon from interfering with clicks

                    // Function to update button styles
                    const updateButtonStyles = () => {
                        if (tunerMode === "chromatic") {
                            chromaticButton.style.backgroundColor = "#A6CEFF"; // Blue for active
                            targetPitchButton.style.backgroundColor = "#FFFFFF"; // White for inactive
                        } else {
                            chromaticButton.style.backgroundColor = "#FFFFFF"; // White for inactive
                            targetPitchButton.style.backgroundColor = "#A6CEFF"; // Blue for active
                        }
                    };

                    // Add click handlers with debounce to prevent double clicks
                    let isClickable = true;
                    const handleClick = mode => {
                        if (!isClickable) return;
                        isClickable = false;
                        tunerMode = mode;
                        updateButtonStyles();
                        setTimeout(() => {
                            isClickable = true;
                        }, 200); // Re-enable after 200ms
                    };

                    chromaticButton.onclick = () => handleClick("chromatic");
                    targetPitchButton.onclick = () => handleClick("target");

                    // Assemble the toggle
                    chromaticButton.appendChild(chromaticIcon);
                    targetPitchButton.appendChild(targetIcon);
                    modeToggle.appendChild(chromaticButton);
                    modeToggle.appendChild(targetPitchButton);

                    // Initial style update
                    updateButtonStyles();

                    tunerContainer.appendChild(modeToggle);

                    // Create note display
                    const noteText = document.createElement("div");
                    noteText.id = "noteText";
                    noteText.style.fontSize = "64px";
                    noteText.style.fontWeight = "bold";
                    noteText.style.marginBottom = "5px";

                    // Create cents deviation display
                    const centsText = document.createElement("div");
                    centsText.id = "centsText";
                    centsText.style.fontSize = "14px";
                    centsText.style.color = "#666666";
                    centsText.style.marginBottom = "5px";

                    // Create tune direction display
                    const tuneDirection = document.createElement("div");
                    tuneDirection.id = "tuneDirection";
                    tuneDirection.style.fontSize = "18px";
                    tuneDirection.style.color = "#FF4500";

                    // Append all elements
                    noteDisplayContainer.appendChild(noteText);
                    noteDisplayContainer.appendChild(centsText);
                    noteDisplayContainer.appendChild(tuneDirection);
                    tunerContainer.appendChild(noteDisplayContainer);
                }

                // Update displays if they exist
                if (noteDisplayContainer) {
                    const noteText = document.getElementById("noteText");
                    const centsText = document.getElementById("centsText");
                    const tuneDirection = document.getElementById("tuneDirection");
                    const targetNoteSelector = document.getElementById("targetNoteSelector");

                    if (noteText) noteText.textContent = note;
                    if (centsText) {
                        centsText.textContent =
                            this.displayText ||
                            (tunerMode === "target"
                                ? "0 cents"
                                : `${cents > 0 ? "+" : ""}${Math.round(cents)} cents`);
                    }

                    // Update target note selector visibility based on mode
                    if (targetNoteSelector) {
                        targetNoteSelector.style.display =
                            tunerMode === "target" ? "block" : "none";
                        targetNoteSelector.textContent = targetPitch.note;
                    }

                    if (tuneDirection) {
                        tuneDirection.textContent = "";
                        tuneDirection.style.color = Math.abs(cents) <= 5 ? "#00FF00" : "#FF4500";
                    }
                }

                // Update tuner segments
                const tunerSegments = document.querySelectorAll("#tunerContainer svg path");

                // Define colors for the gradient
                const colors = {
                    deepRed: "#FF0000",
                    redOrange: "#FF4500",
                    orange: "#FFA500",
                    yellowOrange: "#FFB833",
                    yellowGreen: "#9ACD32",
                    brightGreen: "#00FF00",
                    inactive: "#D3D3D3" // Light gray
                };

                // Update tuner display
                tunerSegments.forEach((segment, i) => {
                    const segmentCents = (i - 5) * 10; // Each segment represents 10 cents

                    // Default to inactive color
                    let segmentColor = colors.inactive;

                    if (tunerMode === "chromatic") {
                        // Chromatic mode - normal behavior
                        const absCents = Math.abs(cents);

                        // Determine if segment should be lit based on current cents value
                        const shouldLight =
                            cents < 0
                                ? segmentCents <= 0 && Math.abs(segmentCents) <= Math.abs(cents) // Flat side
                                : segmentCents >= 0 && segmentCents <= cents; // Sharp side

                        if (shouldLight || Math.abs(cents - segmentCents) <= 5) {
                            // Center segment
                            if (i === 5) {
                                segmentColor =
                                    Math.abs(cents) <= 5 ? colors.brightGreen : colors.inactive;
                            }
                            // Flat side (segments 0-4)
                            else if (i < 5) {
                                switch (i) {
                                    case 0:
                                        segmentColor = colors.deepRed;
                                        break;
                                    case 1:
                                        segmentColor = colors.redOrange;
                                        break;
                                    case 2:
                                        segmentColor = colors.orange;
                                        break;
                                    case 3:
                                        segmentColor = colors.yellowOrange;
                                        break;
                                    case 4:
                                        segmentColor = colors.yellowGreen;
                                        break;
                                }
                            }
                            // Sharp side (segments 6-10)
                            else {
                                switch (i) {
                                    case 6:
                                        segmentColor = colors.yellowGreen;
                                        break;
                                    case 7:
                                        segmentColor = colors.yellowOrange;
                                        break;
                                    case 8:
                                        segmentColor = colors.orange;
                                        break;
                                    case 9:
                                        segmentColor = colors.redOrange;
                                        break;
                                    case 10:
                                        segmentColor = colors.deepRed;
                                        break;
                                }
                            }
                        }
                    } else {
                        // Target pitch mode - use centsFromTarget for segment display
                        const centsFromTarget = cents; // We already calculated this above

                        if (Math.abs(centsFromTarget) > 50) {
                            // More than 50 cents off - only show red segments
                            if (centsFromTarget < 0) {
                                // Flat - light up first (leftmost) segment
                                if (i === 0) segmentColor = colors.deepRed;
                            } else {
                                // Sharp - light up last (rightmost) segment
                                if (i === 10) segmentColor = colors.deepRed;
                            }
                        } else {
                            // Within 50 cents - show normal gradient behavior
                            const shouldLight =
                                centsFromTarget < 0
                                    ? segmentCents <= 0 &&
                                      Math.abs(segmentCents) <= Math.abs(centsFromTarget) // Flat side
                                    : segmentCents >= 0 && segmentCents <= centsFromTarget; // Sharp side

                            if (shouldLight || Math.abs(centsFromTarget - segmentCents) <= 5) {
                                // Center segment
                                if (i === 5) {
                                    segmentColor =
                                        Math.abs(centsFromTarget) <= 5
                                            ? colors.brightGreen
                                            : colors.inactive;
                                }
                                // Flat side (segments 0-4)
                                else if (i < 5) {
                                    switch (i) {
                                        case 0:
                                            segmentColor = colors.deepRed;
                                            break;
                                        case 1:
                                            segmentColor = colors.redOrange;
                                            break;
                                        case 2:
                                            segmentColor = colors.orange;
                                            break;
                                        case 3:
                                            segmentColor = colors.yellowOrange;
                                            break;
                                        case 4:
                                            segmentColor = colors.yellowGreen;
                                            break;
                                    }
                                }
                                // Sharp side (segments 6-10)
                                else {
                                    switch (i) {
                                        case 6:
                                            segmentColor = colors.yellowGreen;
                                            break;
                                        case 7:
                                            segmentColor = colors.yellowOrange;
                                            break;
                                        case 8:
                                            segmentColor = colors.orange;
                                            break;
                                        case 9:
                                            segmentColor = colors.redOrange;
                                            break;
                                        case 10:
                                            segmentColor = colors.deepRed;
                                            break;
                                    }
                                }
                            }
                        }
                    }

                    // Add transition effect for smooth color changes
                    segment.style.transition = "fill 0.1s ease-in-out";
                    segment.setAttribute("fill", segmentColor);
                });
            }

            requestAnimationFrame(updatePitch);
        };

        updatePitch();
    };

    this.stopTuner = () => {
        if (this.tunerMic) {
            this.tunerMic.close();
        }
    };

    const frequencyToNote = frequency => {
        if (frequency <= 0) return { note: "---", cents: 0 };

        const A4 = 440;
        const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        // Calculate how many half steps away from A4 (69 midi note)
        const midiNote = 69 + 12 * Math.log2(frequency / A4);

        // Get the nearest note's MIDI number
        let roundedMidi = Math.round(midiNote);

        // Calculate cents before rounding to nearest note
        const cents = Math.round(100 * (midiNote - roundedMidi));

        // Adjust for edge cases where cents calculation puts us closer to the next note
        if (cents > 50) {
            roundedMidi++;
        } else if (cents < -50) {
            roundedMidi--;
        }

        // Get note name and octave
        const noteIndex = ((roundedMidi % 12) + 12) % 12;
        const octave = Math.floor((roundedMidi - 12) / 12);
        const noteName = noteNames[noteIndex] + octave;

        return { note: noteName, cents: cents };
    };

    /**
     * Gets the current frequency from the tuner
     * @returns {number} The detected frequency in Hz
     */
    this.getTunerFrequency = () => {
        if (!this.tunerAnalyser || !this.detectPitch) return 440; // Default to A4 if no analyser

        const buffer = this.tunerAnalyser.getValue();
        const pitch = this.detectPitch(buffer);

        // Return detected pitch or default to A4
        return pitch > 0 ? pitch : 440;
    };

    /**
     * Creates and displays the cents adjustment interface
     * @returns {void}
     */
    this.createCentsSlider = function () {
        const widgetBody = this.widgetWindow.getWidgetBody();

        // Store the current content to restore later
        this.previousContent = [];
        while (widgetBody.firstChild) {
            this.previousContent.push(widgetBody.firstChild);
            widgetBody.removeChild(widgetBody.firstChild);
        }

        // Create the cents adjustment interface
        const centsInterface = document.createElement("div");
        Object.assign(centsInterface.style, {
            width: "100%",
            height: "100%",
            backgroundColor: "#A6CEFF", // Light blue header section
            display: "flex",
            flexDirection: "column"
        });

        // Create header section
        const header = document.createElement("div");
        Object.assign(header.style, {
            width: "100%",
            padding: "15px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxSizing: "border-box"
        });

        const title = document.createElement("div");
        title.textContent = _("Cents Adjustment");
        Object.assign(title.style, {
            fontWeight: "bold",
            fontSize: "16px"
        });

        const valueDisplay = document.createElement("div");
        valueDisplay.textContent = (this.centsValue >= 0 ? "+" : "") + (this.centsValue || 0) + "¢";
        Object.assign(valueDisplay.style, {
            fontSize: "16px"
        });

        header.appendChild(title);
        header.appendChild(valueDisplay);
        centsInterface.appendChild(header);

        // Create main content area with grey background
        const mainContent = document.createElement("div");
        Object.assign(mainContent.style, {
            flex: 1,
            backgroundColor: "#E8E8E8", // Default grey background
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
        });

        // Create reference tone label
        const referenceLabel = document.createElement("div");
        referenceLabel.textContent = _("reference tone");
        Object.assign(referenceLabel.style, {
            fontSize: "14px",
            color: "#666666"
        });
        mainContent.appendChild(referenceLabel);

        // Create slider container
        const sliderContainer = document.createElement("div");
        Object.assign(sliderContainer.style, {
            width: "100%",
            padding: "10px 0"
        });

        // Create the slider
        const slider = document.createElement("input");
        Object.assign(slider, {
            type: "range",
            min: -50,
            max: 50,
            value: this.centsValue || 0,
            step: 1
        });
        Object.assign(slider.style, {
            width: "100%",
            height: "20px",
            margin: "10px 0",
            backgroundColor: "#4CAF50", // Green color for the slider track
            borderRadius: "10px",
            appearance: "none",
            outline: "none"
        });

        sliderContainer.appendChild(slider);
        mainContent.appendChild(sliderContainer);

        // Create sample label
        const sampleLabel = document.createElement("div");
        sampleLabel.textContent = _("sample");
        Object.assign(sampleLabel.style, {
            fontSize: "14px",
            color: "#666666",
            marginTop: "auto" // Push to bottom
        });
        mainContent.appendChild(sampleLabel);

        centsInterface.appendChild(mainContent);
        widgetBody.appendChild(centsInterface);

        // Add event listener for slider changes
        slider.oninput = () => {
            const value = parseInt(slider.value);
            valueDisplay.textContent = (value >= 0 ? "+" : "") + value + "¢";
            this.centsValue = value;
            // Update tuner display if it exists
            if (this.tunerDisplay) {
                const noteObj = TunerUtils.frequencyToPitch(this._calculateFrequency());
                this.tunerDisplay.update(noteObj[0], this.centsValue, noteObj[2]);
            }
            // Apply the cents adjustment
            this.applyCentsAdjustment();
        };

        this.sliderDiv = centsInterface;
        this.sliderVisible = true;

        // Update button appearance
        this.centsSliderBtn.getElementsByTagName("img")[0].style.filter = "brightness(0) invert(1)";
        this.centsSliderBtn.style.backgroundColor = platformColor.selectorSelected;
    };

    /**
     * Removes the cents adjustment interface
     * @returns {void}
     */
    this.removeCentsSlider = function () {
        if (this.sliderDiv && this.sliderDiv.parentNode) {
            const widgetBody = this.widgetWindow.getWidgetBody();
            // Clear the slider interface by removing all child nodes
            while (widgetBody.firstChild) {
                widgetBody.removeChild(widgetBody.firstChild);
            }

            // Restore the previous content
            if (Array.isArray(this.previousContent)) {
                this.previousContent.forEach(node => {
                    widgetBody.appendChild(node);
                });
            }
            this.previousContent = null;
        }
        this.sliderVisible = false;
        this.centsSliderBtn.getElementsByTagName("img")[0].style.filter = "";
        this.centsSliderBtn.style.backgroundColor = "";
    };

    this.tone = null;
    this.noteFrequencies = {};
    this.startingPitch = "C4";
    this.startingPitchOctave = 4;
    this.octaveTranspose = 0;
    this.inTemperament = "equal";
    this.changeInTemperament = "equal";
    this.inTransposition = 0;
    this.transposition = 2;
    this.playbackRate = 1;
    this.defaultBPMFactor = 1;
    this.recorder = null;
    this.samples = null;
    this.samplesManifest = null;
    this.sampleCentAdjustments = {}; // Initialize the sampleCentAdjustments object
    this.mic = null;

    return this;
}
