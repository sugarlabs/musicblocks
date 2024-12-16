// Copyright (c) 2016-21 Walter Bender
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
   getArticulation
*/

/*
   Global Locations
    - js/utils/utils.js
        _, last
    - js/utils/musicutils.js
        pitchToNumber, getNoteFromInterval, FLAT, SHARP, pitchToFrequency, getCustomNote,
        isCustomTemperament, DOUBLEFLAT, DOUBLESHARP, DEFAULTDRUM, getOscillatorTypes, numberToPitch,
        getArticulation, getOctaveRatio, getTemperament
    - js/turtle-singer.js
        Singer
    - js/utils/platformstyle.js
        platform
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
const SOUNDSAMPLESDEFINES = [
    "samples/violin",
    "samples/cello",
    "samples/flute",
    "samples/guitar",
    "samples/clarinet",
    "samples/saxophone",
    "samples/tuba",
    "samples/trumpet",
    "samples/bass",
    "samples/bottle",
    "samples/clap",
    "samples/darbuka",
    "samples/hihat",
    "samples/splash",
    "samples/bubbles",
    "samples/cowbell",
    "samples/dog",
    "samples/kick",
    "samples/tom",
    "samples/cat",
    "samples/crash",
    "samples/duck",
    "samples/ridebell",
    "samples/triangle",
    "samples/chime",
    "samples/cricket",
    "samples/fingercymbal",
    "samples/slap",
    "samples/clang",
    "samples/cup",
    "samples/floortom",
    "samples/bassdrum",
    "samples/snare",
    "samples/piano",
    "samples/acguit",
    "samples/banjo",
    "samples/bassoon",
    "samples/celeste",
    "samples/raindrop",
    "samples/koto",
    "samples/gong",
    "samples/dulcimer",
    "samples/electricguitar",
    "samples/xylophone",
    "samples/vibraphone",
    "samples/japanese_drum",
    "samples/viola",
    "samples/oboe",
    "samples/trombone",
    "samples/doublebass" // "samples/japanese_bell",
];

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
    "japanese drum": 90
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
    "bassoon": ["D4", 41], // pitchToNumber('C', 5, 'C Major')],
    "celeste": ["C3", 27], // pitchToNumber('C', 3, 'C Major')],
    "vibraphone": ["C5", 51],
    "xylophone": ["C4", 39],
    "viola": ["D4", 53],
    "double bass": ["C4", 39]
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
const stringInstruments = ["piano", "guitar", "acoustic guitar", "electric guitar"];

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

        this.noteFrequencies = {
            // note: [octave, Frequency]
            [startingPitch.substring(0, len - 1)]: [Number(startingPitch.slice(-1)), frequency],
            [getNoteFromInterval(startingPitch, "minor 2")[0]]: [
                getNoteFromInterval(startingPitch, "minor 2")[1],
                t["minor 2"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "augmented 1")[0]]: [
                getNoteFromInterval(startingPitch, "augmented 1")[1],
                t["augmented 1"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "major 2")[0]]: [
                getNoteFromInterval(startingPitch, "major 2")[1],
                t["major 2"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "minor 3")[0]]: [
                getNoteFromInterval(startingPitch, "minor 3")[1],
                t["minor 3"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "augmented 2")[0]]: [
                getNoteFromInterval(startingPitch, "augmented 2")[1],
                t["augmented 2"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "major 3")[0]]: [
                getNoteFromInterval(startingPitch, "major 3")[1],
                t["major 3"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "augmented 3")[0]]: [
                getNoteFromInterval(startingPitch, "augmented 3")[1],
                t["augmented 3"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "diminished 4")[0]]: [
                getNoteFromInterval(startingPitch, "diminished 4")[1],
                t["diminished 4"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "perfect 4")[0]]: [
                getNoteFromInterval(startingPitch, "perfect 4")[1],
                t["perfect 4"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "augmented 4")[0]]: [
                getNoteFromInterval(startingPitch, "augmented 4")[1],
                t["augmented 4"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "diminished 5")[0]]: [
                getNoteFromInterval(startingPitch, "diminished 5")[1],
                t["diminished 5"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "perfect 5")[0]]: [
                getNoteFromInterval(startingPitch, "perfect 5")[1],
                t["perfect 5"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "augmented 5")[0]]: [
                getNoteFromInterval(startingPitch, "augmented 5")[1],
                t["augmented 5"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "minor 6")[0]]: [
                getNoteFromInterval(startingPitch, "minor 6")[1],
                t["minor 6"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "major 6")[0]]: [
                getNoteFromInterval(startingPitch, "major 6")[1],
                t["major 6"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "augmented 6")[0]]: [
                getNoteFromInterval(startingPitch, "augmented 6")[1],
                t["augmented 6"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "minor 7")[0]]: [
                getNoteFromInterval(startingPitch, "minor 7")[1],
                t["minor 7"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "major 7")[0]]: [
                getNoteFromInterval(startingPitch, "major 7")[1],
                t["major 7"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "augmented 7")[0]]: [
                getNoteFromInterval(startingPitch, "augmented 7")[1],
                t["augmented 7"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "diminished 8")[0]]: [
                getNoteFromInterval(startingPitch, "diminished 8")[1],
                t["diminished 8"] * frequency
            ],
            [getNoteFromInterval(startingPitch, "perfect 8")[0]]: [
                getNoteFromInterval(startingPitch, "perfect 8")[1],
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

        const __getFrequency = (oneNote) => {
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
            if (typeof(oneNote) !== "number") {
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
        this.samplesManifest = {
            voice: [
                { name: "piano", data: PIANO_SAMPLE },
                { name: "violin", data: VIOLIN_SAMPLE },
                { name: "viola", data: VIOLA_SAMPLE },
                { name: "double bass", data: DOUBLEBASS_SAMPLE },
                { name: "cello", data: CELLO_SAMPLE },
                { name: "flute", data: FLUTE_SAMPLE },
                { name: "clarinet", data: CLARINET_SAMPLE },
                { name: "saxophone", data: SAXOPHONE_SAMPLE },
                { name: "trumpet", data: TRUMPET_SAMPLE },
                { name: "oboe", data: OBOE_SAMPLE },
                { name: "trombone", data: TROMBONE_SAMPLE },
                { name: "tuba", data: TUBA_SAMPLE },
                { name: "guitar", data: GUITAR_SAMPLE },
                { name: "acoustic guitar", data: ACOUSTIC_GUITAR_SAMPLE },
                { name: "bass", data: BASS_SAMPLE },
                { name: "banjo", data: BANJO_SAMPLE },
                { name: "koto", data: KOTO_SAMPLE },
                { name: "dulcimer", data: DULCIMER_SAMPLE },
                { name: "electric guitar", data: ELECTRICGUITAR_SAMPLE },
                { name: "bassoon", data: BASSOON_SAMPLE },
                { name: "celeste", data: CELESTE_SAMPLE },
                { name: "vibraphone", data: VIBRAPHONE_SAMPLE },
                { name: "xylophone", data: XYLOPHONE_SAMPLE }
            ],
            drum: [
                { name: "bottle", data: BOTTLE_SAMPLE },
                { name: "clap", data: CLAP_SAMPLE },
                { name: "darbuka drum", data: DARBUKA_SAMPLE },
                { name: "hi hat", data: HIHAT_SAMPLE },
                { name: "splash", data: SPLASH_SAMPLE },
                { name: "bubbles", data: BUBBLES_SAMPLE },
                { name: "raindrop", data: RAINDROP_SAMPLE },
                { name: "cow bell", data: COWBELL_SAMPLE },
                { name: "dog", data: DOG_SAMPLE },
                { name: "kick drum", data: KICK_SAMPLE },
                { name: "tom tom", data: TOM_SAMPLE },
                { name: "cat", data: CAT_SAMPLE },
                { name: "crash", data: CRASH_SAMPLE },
                { name: "duck", data: DUCK_SAMPLE },
                { name: "ride bell", data: RIDEBELL_SAMPLE },
                { name: "triangle bell", data: TRIANGLE_SAMPLE },
                { name: "chime", data: CHIME_SAMPLE },
                { name: "gong", data: GONG_SAMPLE },
                { name: "cricket", data: CRICKET_SAMPLE },
                { name: "finger cymbals", data: FINGERCYMBAL_SAMPLE },
                { name: "slap", data: SLAP_SAMPLE },
                { name: "japanese drum", data: JAPANESE_DRUM_SAMPLE },
                // {'name': 'japanese bell', 'data': JAPANESE_BELL_SAMPLE},
                { name: "clang", data: CLANG_SAMPLE },
                { name: "cup drum", data: CUP_SAMPLE },
                { name: "floor tom", data: FLOORTOM_SAMPLE },
                { name: "bass drum", data: BASSDRUM_SAMPLE },
                { name: "snare drum", data: SNARE_SAMPLE }
            ]
        };
        /*eslint-enable no-undef*/
        const data = () => {
            return null;
        };
        this.samplesManifest.voice.push({ name: "empty", data: data });

        /*eslint-disable no-prototype-builtins*/
        if (this.samples === null) {
            this.samples = {};
            for (const type in this.samplesManifest) {
                if (this.samplesManifest.hasOwnProperty(type)) {
                    this.samples[type] = {};
                }
            }
        }
    };

    /**
     * Loads samples into the Synth instance.
     * @function
     * @memberof Synth
     */
    this._loadSample = sampleName => {
        // let accounted = false;
        for (const type in this.samplesManifest) {
            if (this.samplesManifest.hasOwnProperty(type)) {
                for (const sample in this.samplesManifest[type]) {
                    if (this.samplesManifest[type].hasOwnProperty(sample)) {
                        const name = this.samplesManifest[type][sample].name;
                        if (sampleName === name) {
                            // Load data returned from samples function.
                            this.samples[type][name] = this.samplesManifest[type][sample].data();
                            // accounted = true;
                        }
                    }
                }
            }
        }
    };

    /**
     * Array to store samples that need to be loaded at start.
     * @type {Array}
     * @memberof Synth
     */
    this.samplesQueue = []; // Samples that need to be loaded at start.

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
        this.recorder.ondataavailable = (evt) => {
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
            // eslint-disable-next-line no-delete-var
            delete link;
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
            download(url, "");
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
            } else {
                noteDict["C4"] = this.samples.voice[sourceName];
            }
            tempSynth = new Tone.Sampler(noteDict);
        } else if (sourceName in this.samples.drum) {
            instrumentsSource[instrumentName] = [1, sourceName];
            tempSynth = new Tone.Player(this.samples.drum[sourceName]);
        } else if (sourceName in CUSTOMSAMPLES){
            instrumentsSource[instrumentName] = [2, sourceName];
            const noteDict = {};
            const params = CUSTOMSAMPLES[sourceName];
            const center = this._parseSampleCenterNo(params[1], params[2]);
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
        const solfegeDict = {"do":0, "re":2, "mi":4, "fa":5, "sol":7, "la":9, "ti":11};
        const letterDict = {"C":0, "D":2, "E":4, "F":5, "G":7, "A":9, "B":11};

        let attr = getArticulation(solfege);
        if (attr === SHARP) {
            attr = 1;
        } else if (attr ===FLAT) {
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
        // eslint-disable-next-line no-console
        console.log(solfege + octave + " = " + pitchNumber);
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

        this._loadSample(sourceName);
        if (sourceName in this.samples.voice || sourceName in this.samples.drum) {
            instruments[turtle][instrumentName] = this._createSampleSynth(
                turtle,
                instrumentName,
                sourceName,
                params
            ).toDestination();
        } else if (sourceName in BUILTIN_SYNTHS) {
            instruments[turtle][instrumentName] = this._createBuiltinSynth(
                turtle,
                instrumentName,
                sourceName,
                params
            ).toDestination();
        } else if (sourceName in CUSTOM_SYNTHS) {
            instruments[turtle][instrumentName] = this._createCustomSynth(
                sourceName,
                params
            ).toDestination();
            instrumentsSource[instrumentName] = [0, "poly"];
        } else if (sourceName in CUSTOMSAMPLES) {
            instruments[turtle][instrumentName] = this._createSampleSynth(
                turtle,
                instrumentName,
                sourceName,
                params
            ).toDestination();
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
        // We may have a race condition with the samples loader.
        if (this.samples === null) {
            this.samplesQueue.push([instrumentName, sourceName, params]);

            require(SOUNDSAMPLESDEFINES, () => {
                this.loadSamples();
            });
        } else {
            this.__createSynth(turtle, instrumentName, sourceName, params);
        }
    };
    
    /**
     * Loads a synth based on the user's input, creating and setting volume for the specified turtle.
     * @function
     * @memberof Synth
     * @param {string} turtle - The turtle identifier.
     * @param {string} sourceName - The name of the source.
     * @returns {Tone.Instrument|null} - The loaded synth or null if not loaded.
     */
    this.loadSynth = (turtle, sourceName) => {
        /* eslint-disable */
        if (sourceName in instruments[turtle]) {
            if (sourceName.substring(0,13) === "customsample_") {
                console.debug("loading custom " + sourceName);
                this.createSynth(turtle, sourceName, sourceName, null);
            // } else {
            //     console.debug(sourceName + " already loaded");
            }

        } else {
            console.debug("loading " + sourceName);
            this.createSynth(turtle, sourceName, sourceName, null);
        }
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
    this._performNotes = (synth, notes, beatValue, paramsEffects, paramsFilters, setNote, future) => {
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
            /* eslint-enable */
        }

        let numFilters;
        const temp_filters = [];
        if (paramsEffects === null && paramsFilters === null) {
            // See https://github.com/sugarlabs/musicblocks/issues/2951
            try {
                synth.triggerAttackRelease(notes, beatValue, Tone.now() + future);
            } catch(e) {
                // eslint-disable-next-line no-console
                console.debug(e);
            }
        } else {
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
                    synth.chain(temp_filters[k], Tone.Destination);
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
                    synth.chain(vibrato, Tone.Destination);
                }

                if (paramsEffects.doDistortion) {
                    distortion = new Tone.Distortion(
                        paramsEffects.distortionAmount
                    ).toDestination();
                    synth.connect(distortion, Tone.Destination);
                }

                if (paramsEffects.doTremolo) {
                    tremolo = new Tone.Tremolo({
                        frequency: paramsEffects.tremoloFrequency,
                        depth: paramsEffects.tremoloDepth
                    })
                        .toDestination()
                        .start();
                    synth.chain(tremolo);
                }

                if (paramsEffects.doPhaser) {
                    phaser = new Tone.Phaser({
                        frequency: paramsEffects.rate,
                        octaves: paramsEffects.octaves,
                        baseFrequency: paramsEffects.baseFrequency
                    }).toDestination();
                    synth.chain(phaser, Tone.Destination);
                }

                if (paramsEffects.doChorus) {
                    chorus = new Tone.Chorus({
                        frequency: paramsEffects.chorusRate,
                        delayTime: paramsEffects.delayTime,
                        depth: paramsEffects.chorusDepth
                    }).toDestination();
                    synth.chain(chorus, Tone.Destination);
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
                }
            }

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
                    Tone.ToneAudioBuffer.loaded().then(() => {
                        synth.triggerAttackRelease(notes, beatValue, Tone.now() + future);
                    }).catch((e) => {
                    console.debug(e);
                    })

                }   
            }

            setTimeout(() => {
                if (paramsEffects && paramsEffects !== null && paramsEffects !== undefined) {
                    if (paramsEffects.doVibrato) {
                        vibrato.dispose();
                    }

                    if (paramsEffects.doDistortion) {
                        distortion.dispose();
                    }

                    if (paramsEffects.doTremolo) {
                        tremolo.dispose();
                    }

                    if (paramsEffects.doPhaser) {
                        phaser.dispose();
                    }

                    if (paramsEffects.doChorus) {
                        chorus.dispose();
                    }

                    if (paramsEffects.doNeighbor) {
                        neighbor.dispose();
                    }
                }

                if (paramsFilters && paramsFilters !== null && paramsFilters !== undefined) {
                    for (let k = 0; k < numFilters; k++) {
                        temp_filters[k].dispose();
                    }
                }
            }, beatValue * 1000);
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
    this.trigger = (
        turtle,
        notes,
        beatValue,
        instrumentName,
        paramsEffects,
        paramsFilters,
        setNote,
        future
    ) => {
        // eslint-disable-next-line no-console
        console.debug(
            turtle +
                " " +
                notes +
                " " +
                beatValue +
                " " +
                instrumentName +
                " " +
                paramsEffects +
                " " +
                paramsFilters +
                " " +
                setNote +
                " " +
                future
        );
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
                // eslint-disable-next-line no-console
                console.debug(sampleName);
            }
        }

        // Get note values as per the source of the synth.
        if (future === undefined) {
            future = 0.0;
        }
        switch (flag) {
            case 1: // drum
                if (
                    instrumentName.slice(0, 4) === "http" ||
                    instrumentName.slice(0, 21) === "data:audio/wav;base64"
                ) {
                    tempSynth.start(Tone.now() + future);
                } else if (instrumentName.slice(0, 4) === "file") {
                    tempSynth.start(Tone.now() + future);
                } else {
                    try {
                        tempSynth.start(Tone.now() + future);
                    } catch (e) {
                        // Occasionally we see "Start time must be
                        // strictly greater than previous start time"
                        // eslint-disable-next-line no-console
                        console.debug(e);
                    }
                }
                break;
            case 2: // voice sample
                this._performNotes(
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

                this._performNotes(
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
                tempSynth.triggerAttackRelease("c2", beatValue, Tone.now + future);
                break;
            case 0: // default synth
            default:
                this._performNotes(
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
        const loopA = new Tone.Loop((time) => {
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

    this.stop =  () => {
        Tone.Transport.stop();
    };

    this.rampTo = (turtle, instrumentName, oldVol, volume, rampTime) => {
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

        const db = Tone.gainToDb(nv / 100);

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
     * Sets the volume of a specific instrument for a given turtle.
     * @function
     * @memberof Synth
     * @param {string} turtle - The name of the turtle.
     * @param {string} instrumentName - The name of the instrument.
     * @param {number} volume - The volume level (0 to 100).
     */
    this.setVolume = (turtle, instrumentName, volume) => {
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

        // Convert volume to decibals
        const db = Tone.gainToDb(nv / 100);
        if (instrumentName in instruments[turtle]) {
            instruments[turtle][instrumentName].volume.value = db;
        }
    };

    /**
     * Gets the volume of a specific instrument for a given turtle.
     * @function
     * @memberof Synth
     * @param {string} turtle - The name of the turtle.
     * @param {string} instrumentName - The name of the instrument.
     * @returns {number} The volume level.
     * @deprecated This method is currently unused and may not return correct values.
     */
    this.getVolume = (turtle, instrumentName) => {
        if (instrumentName in instruments[turtle]) {
            return instruments[turtle][instrumentName].volume.value;
        } else {
            // eslint-disable-next-line no-console
            console.debug("instrument not found");
            return 50;
        }
    };
    
    /**
     * Sets the master volume for all instruments.
     * @function
     * @memberof Synth
     * @param {number} volume - The master volume level (0 to 100).
     */
    this.setMasterVolume = volume => {
        const db = Tone.gainToDb(volume / 100);
        Tone.Destination.volume.rampTo(db, 0.01);
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
        await this.mic.open()
        .then(() => {
            console.log("Mic opened");
            this.mic.connect(this.recorder);
            this.recorder.start();
        })
        .catch((error) => {
            console.log(error);
        });
    }

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
    }

    /**
     * Plays Recording
     * @function
     * @memberof Synth
     */
    this.playRecording = async () => {
        const player = new Tone.Player().toDestination();
        await player.load(this.audioURL)
        player.start();
    }

    /**
     * Analyzing the audio
     * @function
     * @memberof Synth
     */
    this.LiveWaveForm = () => {
        this.analyser = new Tone.Analyser('waveform', 8192);
        this.mic.connect(this.analyser);
    }

    /**
    * Gets real-time waveform values
    * @function
    * @memberof Synth
    */
    this.getWaveFormValues = () => {
        const values = this.analyser.getValue();
        return values;
    };

    return this;
}
