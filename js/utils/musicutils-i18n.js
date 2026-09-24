// Copyright (c) 2016-23 Walter Bender
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

   _
 */

/*
   exported

   SOLFEGECONVERSIONTABLE, FIXEDSOLFEGE1, SEMITONETOINTERVALMAP, DEGREES,
   SELECTORSTRINGS, ACCIDENTALLABELS, INVERTMODES, INTERVALS, FILTERTYPES,
   OSCTYPES, MusicUtilsI18n
 */

// var, not const: a hoisted var in musicutils.js cannot redeclare a top-level const.

if (typeof module !== "undefined" && module.exports) {
    var MusicUtilsConstants =
        (typeof window !== "undefined" && window.MusicUtilsConstants) ||
        (typeof require !== "undefined" ? require("./musicutils-constants") : {});
    var { FLAT, SHARP, DOUBLESHARP, NATURAL, DOUBLEFLAT } = MusicUtilsConstants;
}

/**
 * Maps from Western note names to their corresponding solfege names.
 * @constant {Object.<string, string>}
 */
var SOLFEGECONVERSIONTABLE = {
    "C♭": "do" + FLAT,
    "C": "do",
    "C♯": "do" + SHARP,
    "D♭": "re" + FLAT,
    "D": "re",
    "D♯": "re" + SHARP,
    "E♭": "mi" + FLAT,
    "E": "mi",
    "F": "fa",
    "F♯": "fa" + SHARP,
    "G♭": "sol" + FLAT,
    "G": "sol",
    "G♯": "sol" + SHARP,
    "A♭": "la" + FLAT,
    "A": "la",
    "A♯": "la" + SHARP,
    "B♭": "ti" + FLAT,
    "B": "ti",
    "B♯": "ti" + SHARP,
    "R": _("rest")
};

/**
 * Maps from fixed solfege names with accidentals to their corresponding Western note names.
 * @constant {Object.<string, string>}
 */
var FIXEDSOLFEGE1 = {
    "do𝄫": "B" + FLAT,
    "do♭": "C" + FLAT,
    "do": "C",
    "do♯": "C" + SHARP,
    "do𝄪": "D",
    "re𝄫": "C",
    "re♭": "D" + FLAT,
    "re": "D",
    "re♯": "D" + SHARP,
    "re𝄪": "E",
    "mi𝄫": "D",
    "mi♭": "E" + FLAT,
    "mi": "E",
    "mi♯": "E" + SHARP,
    "mi𝄪": "F" + SHARP,
    "fa𝄫": "E" + FLAT,
    "fa♭": "F" + FLAT,
    "fa": "F",
    "fa♯": "F" + SHARP,
    "fa𝄪": "G",
    "sol𝄫": "F",
    "sol♭": "G" + FLAT,
    "sol": "G",
    "sol♯": "G" + SHARP,
    "sol𝄪": "A",
    "la𝄫": "G",
    "la♭": "A" + FLAT,
    "la": "A",
    "la♯": "A" + SHARP,
    "la𝄪": "B",
    "ti𝄫": "A",
    "ti♭": "B" + FLAT,
    "ti": "B",
    "ti♯": "B" + SHARP,
    "ti𝄪": "C" + SHARP,
    "R": _("rest")
};

var SEMITONETOINTERVALMAP = {
    0: { 0: _("Perfect unison"), 1: _("Diminished second") },
    1: { 1: _("Minor second"), 0: _("Augmented unison") },
    2: { 1: _("Major second"), 2: _("Diminished third") },
    3: { 2: _("Minor third"), 1: _("Augmented second") },
    4: { 2: _("Major third"), 3: _("Diminished fourth") },
    5: { 3: _("Perfect fourth"), 2: _("Augmented third") },
    6: { 4: _("Diminished fifth"), 3: _("Augmented fourth") },
    7: { 4: _("Perfect fifth"), 5: _("Diminished sixth") },
    8: { 5: _("Minor sixth"), 4: _("Augmented fifth") },
    9: { 5: _("Major sixth"), 6: _("Diminished seventh") },
    10: { 6: _("Minor seventh"), 5: _("Augmented sixth") },
    11: { 6: _("Major seventh"), 0: _("Diminished octave") },
    12: { 0: _("Perfect octave"), 6: _("Augmented seventh") },
    13: { 1: _("Minor ninth"), 0: _("Augmented octave") },
    14: { 1: _("Major ninth"), 2: _("Diminished tenth") },
    15: { 2: _("Minor tenth"), 1: _("Augmented ninth") },
    16: { 2: _("Major tenth"), 3: _("Diminished eleventh") },
    17: { 3: _("Perfect eleventh"), 2: _("Augmented tenth") },
    18: { 4: _("Diminished twelfth"), 3: _("Augmented eleventh") },
    19: { 4: _("Perfect twelfth"), 5: _("Diminished thirteenth") },
    20: { 5: _("Minor thirteenth"), 4: _("Augmented fifth, plus an octave") },
    21: { 5: _("Major thirteenth"), 6: _("Diminished seventh, plus an octave") }
};

//.TRANS: ordinal number. Please keep exactly one space between each number.
/**
 * Ordinal numbers for degrees.
 * @constant {string}
 */
var DEGREES = _("1st 2nd 3rd 4th 5th 6th 7th 8th 9th 10th 11th 12th");

/**
 * Musical terms used in selectors that may require translation.
 * @constant {Array<string>}
 */
var SELECTORSTRINGS = [
    //.TRANS: unison is a music term related to intervals
    _("unison"),
    //.TRANS: augmented is a music term related to intervals
    _("augmented"),
    //.TRANS: diminished is a music term related to intervals and mode
    _("diminished"),
    //.TRANS: minor is a music term related to intervals and mode
    _("minor"),
    //.TRANS: major is a music term related to intervals and mode
    _("major"),
    //.TRANS: perfect is a music term related to intervals
    _("perfect"),
    //.TRANS: twelve semi-tone scale for music
    _("chromatic"),
    _("algerian"),
    _("spanish"),
    //.TRANS: modal scale in music
    _("octatonic"),
    //.TRANS: harmonic major scale in music
    _("harmonic major"),
    //.TRANS: natural minor scales in music
    _("natural minor"),
    //.TRANS: harmonic minor scale in music
    _("harmonic minor"),
    //.TRANS: melodic minor scale in music
    _("melodic minor"),
    //.TRANS: modal scale for music
    _("ionian"),
    //.TRANS: modal scale for music
    _("dorian"),
    //.TRANS: modal scale for music
    _("phrygian"),
    //.TRANS: modal scale for music
    _("lydian"),
    //.TRANS: modal scale for music
    _("mixolydian"),
    //.TRANS: modal scale for music
    _("aeolian"),
    //.TRANS: modal scale for music
    _("locrian"),
    //.TRANS: minor jazz scale for music
    _("jazz minor"),
    //.TRANS: bebop scale for music
    _("bebop"),
    _("arabic"),
    _("byzantine"),
    //.TRANS: musical scale for music by Verdi
    _("enigmatic"),
    _("ethiopian"),
    //.TRANS: Ethiopic scale for music
    _("geez"),
    _("hindu"),
    _("hungarian"),
    //.TRANS: minor Romanian scale for music
    _("romanian minor"),
    _("spanish gypsy"),
    //.TRANS: musical scale for Mid-Eastern music
    _("maqam"),
    //.TRANS: minor blues scale for music
    _("minor blues"),
    //.TRANS: major blues scale for music
    _("major blues"),
    _("whole tone"),
    //.TRANS: pentatonic is a general term that means "five note scale". This scale is typically known as "minor pentatonic"
    _("minor pentatonic"),
    //.TRANS: pentatonic is a general term that means "five note scale". This scale is typically known as "major pentatonic"
    _("major pentatonic"),
    _("chinese"),
    _("egyptian"),
    //.TRANS: https://en.wikipedia.org/wiki/Hirajoshi_scale NOTE: There are three different versions of this scale
    _("hirajoshi"),
    _("Japan"),
    //.TRANS: https://en.wikipedia.org/wiki/In_scale and https://en.wikipedia.org/wiki/Sakura_Sakura
    _("in"),
    //.TRANS: https://en.wikipedia.org/wiki/Miny%C5%8D_scale
    _("minyo"),
    //.TRANS: Italian mathematician
    _("fibonacci"),
    _("custom"),
    //.TRANS: highpass filter
    _("highpass"),
    //.TRANS: lowpass filter
    _("lowpass"),
    //.TRANS: bandpass filter
    _("bandpass"),
    //.TRANS: high-shelf filter
    _("highshelf"),
    //.TRANS: low-shelf filter
    _("lowshelf"),
    //.TRANS: notch-shelf filter
    _("notch"),
    //.TRANS: all-pass filter
    _("allpass"),
    //.TRANS: peaking filter
    _("peaking"),
    _("sine"),
    _("square"),
    _("triangle"),
    _("sawtooth"),
    //.TRANS: even numbers
    _("even"),
    //.TRANS: odd numbers
    _("odd"),
    _("scalar"),
    _("piano"),
    _("violin"),
    _("viola"),
    _("xylophone"),
    _("vibraphone"),
    _("cello"),
    _("bass"),
    _("double bass"),
    _("guitar"),
    _("sitar"),
    _("harmonium"),
    _("mandolin"),
    _("acoustic guitar"),
    _("flute"),
    _("clarinet"),
    _("saxophone"),
    _("tuba"),
    _("trumpet"),
    _("oboe"),
    _("trombone"),
    _("electronic synth"),
    _("simple 1"),
    _("simple 2"),
    _("simple 3"),
    _("simple 4"),
    _("white noise"),
    _("brown noise"),
    _("pink noise"),
    _("custom"),
    _("snare drum"),
    _("kick drum"),
    _("tom tom"),
    _("floor tom"),
    _("bass drum"),
    _("cup drum"),
    _("darbuka drum"),
    _("hi hat"),
    _("ride bell"),
    _("cow bell"),
    _("japanese drum"),
    // _('japanese bell'),
    _("triangle bell"),
    _("finger cymbals"),
    _("chime"),
    _("gong"),
    _("clang"),
    _("crash"),
    _("bottle"),
    _("clap"),
    _("slap"),
    _("splash"),
    _("bubbles"),
    _("raindrop"),
    _("cat"),
    _("cricket"),
    _("dog"),
    _("duck"),
    _("banjo"),
    _("koto"),
    _("dulcimer"),
    _("electric guitar"),
    _("bassoon"),
    _("celeste"),
    //.TRANS: musical temperament
    _("equal"),
    //.TRANS: musical temperament
    _("Pythagorean"),
    //.TRANS: musical temperament
    _("just intonation"),
    //.TRANS: musical temperament
    _("Meantone").toLowerCase(),
    _("custom"),
    //.TRANS: double flat is a music term related to pitch
    _("double flat"),
    //.TRANS: flat is a music term related to pitch
    _("flat"),
    //.TRANS: natural is a music term related to pitch
    _("natural"),
    //.TRANS: sharp is a music term related to pitch
    _("sharp"),
    //.TRANS: double sharp is a music term related to pitch
    _("double sharp"),
    // Chord names
    _("major"),
    _("minor"),
    _("augmented"),
    _("diminished"),
    _("major 7th"),
    _("minor 7th"),
    _("dominant 7th"),
    _("minor-major 7th"),
    _("fully-diminished 7th"),
    _("half-diminished 7th"),
    _("custom")
];

/**
 * Labels for accidentals, including their names and symbols.
 * @constant {Array<string>}
 */
var ACCIDENTALLABELS = [
    _("double sharp") + " " + DOUBLESHARP,
    _("sharp") + " " + SHARP,
    _("natural") + " " + NATURAL,
    _("flat") + " " + FLAT,
    _("double flat") + " " + DOUBLEFLAT
];

/**
 * Modes for inverting chords.
 * @constant {Array<Array<string>>}
 */
var INVERTMODES = [
    [_("even"), "even"],
    [_("odd"), "odd"],
    [_("scalar"), "scalar"]
];

/**
 * Musical intervals and their characteristics.
 * @constant {Array<Array<string>>}
 */
var INTERVALS = [
    [_("perfect"), "perfect", [1, 4, 5, 8]],
    [_("minor"), "minor", [2, 3, 6, 7]],
    [_("diminished"), "diminished", [2, 3, 4, 5, 6, 7, 8]],
    [_("augmented"), "augmented", [1, 2, 3, 4, 5, 6, 7, 8]],
    [_("major"), "major", [2, 3, 6, 7]]
];

/**
 * Filter types used in audio processing.
 * @constant {Array<Array<string>>}
 */
var FILTERTYPES = [
    [_("highpass"), "highpass"],
    [_("lowpass"), "lowpass"],
    [_("bandpass"), "bandpass"],
    [_("highshelf"), "highshelf"],
    [_("lowshelf"), "lowshelf"],
    [_("notch"), "notch"],
    [_("allpass"), "allpass"],
    [_("peaking"), "peaking"]
];

/**
 * Oscillator types used in audio synthesis.
 * @constant {Array<Array<string>>}
 */
var OSCTYPES = [
    [_("sine"), "sine"],
    [_("square"), "square"],
    [_("triangle"), "triangle"],
    [_("sawtooth"), "sawtooth"]
];

var MusicUtilsI18n = {
    SOLFEGECONVERSIONTABLE,
    FIXEDSOLFEGE1,
    SEMITONETOINTERVALMAP,
    DEGREES,
    SELECTORSTRINGS,
    ACCIDENTALLABELS,
    INVERTMODES,
    INTERVALS,
    FILTERTYPES,
    OSCTYPES
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicUtilsI18n;
}

if (typeof window !== "undefined") {
    window.MusicUtilsI18n = MusicUtilsI18n;
}
