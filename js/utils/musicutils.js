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

   _, last, DRUMNAMES, NOISENAMES, VOICENAMES, INVALIDPITCH, CUSTOMSAMPLES
*/

/*
   Global Locations
    js/utils/utils.js
        _, last
    js/utils/synthutils.js
        VOICENAMES, DRUMNAMES, NOISENAMES
    js/logo.js
        INVALIDPITCH
 */

/*
  exported

  SYNTHSVG, RSYMBOLS, NOTENAMES, ALLNOTENAMES, NOTENAMES1,
  WESTERN2EISOLFEGENAMES, PITCHES1, PITCHES3, SCALENOTES,
  EASTINDIANSOLFNOTES, DRUMS, GRAPHICS, SOLFATTRS, DEGREES,
  RHYTHMRULERHEIGHT, SLIDERHEIGHT, SLIDERWIDTH, MATRIXLABELCOLOR,
  MATRIXNOTECELLCOLOR, MATRIXTUPLETCELLCOLOR, MATRIXRHYTHMCELLCOLOR,
  MATRIXBUTTONCOLORHOVER, MATRIXNOTECELLCOLORHOVER, MATRIXSOLFEWIDTH,
  EIGHTHNOTEWIDTH, MATRIXBUTTONHEIGHT, MATRIXBUTTONHEIGHT2,
  MATRIXSOLFEHEIGHT, NOTESYMBOLS, SELECTORSTRINGS, ACCIDENTALLABELS,
  ACCIDENTALNAMES, ACCIDENTALVALUES, INTERVALS, MODE_PIE_MENUS,
  updateTemperaments, DEFAULTINVERT, DEFAULTINTERVAL, DEFAULTEFFECT,
  DEFAULTMODE, DEFAULTOSCILLATORTYPE, DEFAULTACCIDENTAL,
  getInvertMode, getIntervalNumber, getIntervalDirection,
  getModeNumbers, getDrumIndex, getDrumName, getDrumSymbol,
  getFilterTypes, getOscillatorTypes, getDrumIcon, getDrumSynthName,
  getNoiseName, getNoiseIcon, getNoiseSynthName, getVoiceName,
  getVoiceIcon, getVoiceSynthName, getTemperamentKeys,
  getTemperamentName, getStepSizeUp, getStepSizeDown, getModeLength,
  nthDegreeToPitch, getInterval, calcNoteValueToDisplay,
  durationToNoteValue, noteToFrequency, getSolfege, splitScaleDegree,
  getNumNote, calcOctave, calcOctaveInterval, isInt,
  convertFromSolfege, getPitchInfo, MATRIXBUTTONCOLOR, i18nSolfege,
  convertFactor, getOctaveRatio, setOctaveRatio, getTemperamentsList,
  addTemperamentToList, getTemperament, deleteTemperamentFromList,
  addTemperamentToDictionary, buildScale, CHORDNAMES, CHORDVALUES,
  DEFAULTCHORD, DEFAULTVOICE, setCustomChord, EQUIVALENTACCIDENTALS,
  INTERVALVALUES, getIntervalRatio, frequencyToPitch, NOTESTEP
*/

/**
 * Scalable sinewave graphic.
 * @const
 * @type {string}
 */
const SYNTHSVG =
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?> <svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" y="0px" xml:space="preserve" x="0px" width="SVGWIDTHpx" viewBox="0 0 SVGWIDTH 55" version="1.1" height="55px" enable-background="new 0 0 SVGWIDTH 55"><g transform="scale(XSCALE,1)"><path d="m 1.5,27.5 c 0,0 2.2,-17.5 6.875,-17.5 4.7,0.0 6.25,11.75 6.875,17.5 0.75,6.67 2.3,17.5 6.875,17.5 4.1,0.0 6.25,-13.6 6.875,-17.5 C 29.875,22.65 31.1,10 35.875,10 c 4.1,0.0 5.97,13.0 6.875,17.5 1.15,5.7 1.75,17.5 6.875,17.5 4.65,0.0 6.875,-17.5 6.875,-17.5" style="stroke:#90c100;fill-opacity:1;fill:none;stroke-width:STROKEWIDTHpx;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /></g></svg>';

/**
 * Notes graphics.
 * @const
 * @type {string}
 */
const WHOLENOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="svg6468" viewBox="0 0 5.1680003 12.432" height="12.432" width="5.1680002"> <g transform="translate(-375.23523,-454.37592)"> <g transform="translate(7.9606,5.6125499)" style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 369.80263,457.99537 q 1.104,0 1.872,0.432 0.768,0.416 0.768,1.2 0,0.752 -0.752,1.168 -0.752,0.4 -1.808,0.4 -1.104,0 -1.856,-0.416 -0.752,-0.416 -0.752,-1.232 0,-0.576 0.464,-0.944 0.48,-0.368 1.008,-0.48 0.528,-0.128 1.056,-0.128 z m -0.864,1.136 q 0,0.672 0.304,1.184 0.304,0.512 0.784,0.512 0.736,0 0.736,-0.8 0,-0.64 -0.304,-1.136 -0.288,-0.512 -0.8,-0.512 -0.72,0 -0.72,0.752 z" /> </g> </g> </svg>';

const HALFNOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3.84 12.432" height="3.5085866mm" width="1.0837333mm"> <g transform="translate(-375.23523,-454.37592)"> <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 375.23523,465.70392 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-9.472 0.352,0 0,10.352 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 0.736,0.48 q 0.848,0 1.712,-0.72 0.88,-0.72 0.88,-1.072 0,-0.224 -0.192,-0.224 -0.592,0 -1.632,0.688 -1.024,0.672 -1.024,1.12 0,0.208 0.256,0.208 z" /> </g> </g> </svg>';

const QUARTERNOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4.0859801 11.74224" height="3.313921mm" width="1.1531544mm"> <g transform="translate(-226.1339,-457.841)"> <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 229.60268,457.841 0.5625,0 0.0547,0.0625 0,10.02344 q 0,1.27344 -1.53125,1.625 l -0.375,0.0313 -0.27343,0 q -1.65625,0 -1.875,-1.03906 l -0.0313,-0.24219 q 0,-1.01562 1.64843,-1.20312 l 0.25782,-0.0391 q 0.77343,0 1.47656,0.5 l 0.0313,0 0,-9.65625 0.0547,-0.0625 z" /> </g> </g> </svg>';

const EIGHTHNOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7.5234898 11.7422" height="3.3139098mm" width="2.123296mm"> <g transform="translate(-244.80575,-403.5553)"> <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 248.14955,403.5553 0.67969,0 0.0625,0.0547 0,0.30468 q 0.21094,0.42188 1.5625,0.91407 1.875,0.54687 1.875,1.625 0,1.14062 -0.95313,1.89062 l -0.0313,0 -0.23437,-0.25 q 0.47656,-0.38281 0.47656,-1.03906 0,-0.54688 -1.78125,-1.10156 -0.71875,-0.32813 -0.91406,-0.53125 l 0,8.32812 q 0,1.19531 -1.75,1.54688 l -0.44531,0 q -1.89063,0 -1.89063,-1.3125 0,-1.02344 1.65625,-1.20313 l 0.17969,0 q 0.75,0 1.44531,0.5 l 0,-9.67187 0.0625,-0.0547 z" /> </g> </g> </svg>';

const SIXTEENTHNOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7.0080001 12.432" height="3.5085866mm" width="1.9778134mm"> <g transform="translate(-182.21292,-431.51877)"> <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 182.21292,442.84677 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-9.472 0.336,0 q 0.064,0.56 0.4,1.088 0.352,0.512 0.8,0.944 0.448,0.416 0.88,0.864 0.448,0.432 0.752,1.024 0.304,0.576 0.304,1.232 0,0.544 -0.256,1.104 0.304,0.448 0.304,1.184 0,1.232 -0.608,2.24 l -0.384,0 q 0.56,-1.12 0.56,-2.032 0,-0.512 -0.256,-0.96 -0.24,-0.448 -0.752,-0.816 -0.496,-0.368 -0.832,-0.56 -0.32,-0.192 -0.896,-0.48 l 0,5.52 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 6.464,-5.904 q 0,-1.648 -2.624,-3.072 0,0.464 0.192,0.88 0.192,0.416 0.512,0.752 0.32,0.32 0.656,0.592 0.336,0.272 0.688,0.608 0.352,0.32 0.544,0.608 0.032,-0.256 0.032,-0.368 z" /> </g> </g> </svg>';

const THIRTYSECONDNOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7.0080001 14.496001" height="4.0910935mm" width="1.9778134mm"> <g transform="translate(-630.78433,-240.88335)">  <g  style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1">  <path  d="m 630.78433,254.27535 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-11.536 0.352,0 q 0.048,0.56 0.384,1.072 0.336,0.496 0.768,0.912 0.432,0.4 0.864,0.848 0.432,0.448 0.72,1.104 0.304,0.656 0.304,1.456 0,0.48 -0.16,1.056 0.224,0.416 0.224,0.912 0,0.512 -0.24,0.976 0.304,0.448 0.304,1.168 0,1.232 -0.608,2.24 l -0.384,0 q 0.56,-1.12 0.56,-2.032 0,-0.512 -0.256,-0.96 -0.24,-0.448 -0.752,-0.816 -0.496,-0.368 -0.832,-0.56 -0.32,-0.192 -0.896,-0.48 l 0,5.52 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 6.448,-7.872 q 0,-0.496 -0.208,-0.928 -0.192,-0.432 -0.64,-0.832 -0.432,-0.416 -0.784,-0.672 -0.352,-0.256 -0.976,-0.656 0.032,0.448 0.352,0.896 0.32,0.432 0.704,0.752 0.4,0.32 0.848,0.8 0.464,0.464 0.704,0.912 l 0,-0.272 z m 0,2.096 q 0,-0.4 -0.16,-0.768 -0.144,-0.368 -0.32,-0.608 -0.16,-0.256 -0.592,-0.608 -0.416,-0.352 -0.672,-0.528 -0.256,-0.176 -0.848,-0.576 0.064,0.48 0.4,0.976 0.336,0.48 0.72,0.816 0.4,0.336 0.832,0.784 0.448,0.432 0.64,0.784 l 0,-0.272 z" /> </g> </g> </svg>';

const SIXTYFOURTHNOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7.0080001 14.528" height="4.1001244mm" width="1.9778134mm"> <g transform="translate(-345.3223,-325.39492)"> <g transform="translate(3.1093785,1.6864426)" style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 342.21292,337.13248 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-11.568 0.336,0 q 0.064,0.64 0.384,1.104 0.336,0.464 0.752,0.768 0.416,0.304 0.832,0.656 0.416,0.336 0.688,0.928 0.288,0.592 0.288,1.44 0,0.24 -0.144,0.768 0.256,0.608 0.256,1.376 0,0.32 -0.16,0.896 0.224,0.416 0.224,0.912 0,0.496 -0.24,0.96 0.304,0.448 0.304,1.024 0,0.384 -0.08,0.688 -0.08,0.304 -0.16,0.448 -0.08,0.144 -0.368,0.608 l -0.384,0 q 0.08,-0.16 0.192,-0.368 0.112,-0.224 0.16,-0.32 0.064,-0.096 0.112,-0.24 0.064,-0.144 0.08,-0.288 0.016,-0.144 0.016,-0.32 0,-0.272 -0.096,-0.512 -0.08,-0.256 -0.176,-0.432 -0.096,-0.192 -0.32,-0.4 -0.224,-0.208 -0.368,-0.32 -0.144,-0.128 -0.464,-0.304 -0.304,-0.192 -0.432,-0.256 -0.128,-0.064 -0.48,-0.224 -0.336,-0.176 -0.4,-0.208 l 0,4.064 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 6.352,-8.384 q 0,-0.352 -0.144,-0.688 -0.128,-0.352 -0.288,-0.576 -0.16,-0.224 -0.48,-0.496 -0.32,-0.272 -0.512,-0.4 -0.192,-0.144 -0.592,-0.384 -0.384,-0.24 -0.496,-0.32 0.032,0.432 0.352,0.832 0.32,0.384 0.704,0.656 0.4,0.272 0.816,0.72 0.432,0.432 0.624,0.912 0.016,-0.176 0.016,-0.256 z m 0.016,2.128 q 0,-0.208 -0.048,-0.4 -0.032,-0.192 -0.08,-0.336 -0.048,-0.16 -0.176,-0.336 -0.128,-0.176 -0.208,-0.288 -0.08,-0.112 -0.272,-0.272 -0.192,-0.176 -0.288,-0.256 -0.096,-0.08 -0.352,-0.256 -0.24,-0.176 -0.336,-0.224 -0.096,-0.064 -0.384,-0.24 -0.288,-0.192 -0.384,-0.256 0.032,0.464 0.368,0.88 0.336,0.416 0.736,0.704 0.4,0.272 0.816,0.688 0.416,0.416 0.576,0.864 0.032,-0.192 0.032,-0.272 z m -0.016,1.936 q 0,-0.848 -0.624,-1.504 -0.608,-0.672 -1.872,-1.392 0.064,0.464 0.384,0.896 0.336,0.416 0.72,0.688 0.4,0.272 0.8,0.704 0.4,0.416 0.576,0.88 0.016,-0.064 0.016,-0.272 z" /> </g> </g> </svg>';

// Is there a "proper" double-sharp symbol as well? I see this from wikipedia: U+1D12A 𝄪 MUSICAL SYMBOL DOUBLE SHARP (HTML &#119082;) (https://en.wikipedia.org/wiki/Double_sharp)

/**
 * Symbol for a sharp note.
 * @constant {string}
 * @default
 */
const SHARP = "♯";

/**
 * Symbol for a flat note.
 * @constant {string}
 * @default
 */
const FLAT = "♭";

/**
 * Symbol for a natural note.
 * @constant {string}
 * @default
 */
const NATURAL = "♮";

/**
 * Symbol for a double sharp note.
 * @constant {string}
 * @default
 */
const DOUBLESHARP = "𝄪";

/**
 * Symbol for a double flat note.
 * @constant {string}
 * @default
 */
const DOUBLEFLAT = "𝄫";

/**
 * Symbols representing different note durations.
 * @constant {Object.<number, string>}
 * @default
 */
const NSYMBOLS = { 1: "𝅝", 2: "𝅗𝅥", 4: "♩", 8: "♪", 16: "𝅘𝅥𝅯" };

/**
 * Symbols representing different rest durations.
 * @constant {Object.<number, string>}
 * @default
 */
const RSYMBOLS = { 1: "𝄻", 2: "𝄼", 4: "𝄽" };

/**
 * Maps from notes with flats to their corresponding notes with '♭' (flat) symbol.
 * @constant {Object.<string, string>}
 */
const BTOFLAT = {
    Eb: "E" + FLAT,
    Gb: "G" + FLAT,
    Ab: "A" + FLAT,
    Bb: "B" + FLAT,
    Db: "D" + FLAT,
    Cb: "C" + FLAT,
    Fb: "F" + FLAT,
    eb: "E" + FLAT,
    gb: "G" + FLAT,
    ab: "A" + FLAT,
    bb: "B" + FLAT,
    db: "D" + FLAT,
    cb: "C" + FLAT,
    fb: "F" + FLAT
};

/**
 * Maps from notes with flats to their corresponding notes with '♯' (sharp) symbol.
 * @constant {Object.<string, string>}
 */
const STOSHARP = {
    "E#": "E" + SHARP,
    "G#": "G" + SHARP,
    "A#": "A" + SHARP,
    "B#": "B" + SHARP,
    "D#": "D" + SHARP,
    "C#": "C" + SHARP,
    "F#": "F" + SHARP,
    "e#": "E" + SHARP,
    "g#": "G" + SHARP,
    "a#": "A" + SHARP,
    "b#": "B" + SHARP,
    "d#": "D" + SHARP,
    "c#": "C" + SHARP,
    "f#": "F" + SHARP
};

/**
 * Array of notes with sharps.
 * @constant {string[]}
 */
const NOTESSHARP = [
    "C",
    "C" + SHARP,
    "D",
    "D" + SHARP,
    "E",
    "F",
    "F" + SHARP,
    "G",
    "G" + SHARP,
    "A",
    "A" + SHARP,
    "B"
];


/**
 * Array of notes with flats.
 * @constant {string[]}
 */
const NOTESFLAT = [
    "C",
    "D" + FLAT,
    "D",
    "E" + FLAT,
    "E",
    "F",
    "G" + FLAT,
    "G",
    "A" + FLAT,
    "A",
    "B" + FLAT,
    "B"
];

/**
 * Array of lowercase notes with flats.
 * @constant {string[]}
 */
const NOTESFLAT2 = [
    "c",
    "d" + FLAT,
    "d",
    "e" + FLAT,
    "e",
    "f",
    "g" + FLAT,
    "g",
    "a" + FLAT,
    "a",
    "b" + FLAT,
    "b"
];

/**
 * Equivalent flats for various notes.
 * @const
 * @type {Object.<string, string>}
 */
const EQUIVALENTFLATS = {
    "C♯": "D" + FLAT,
    "D♯": "E" + FLAT,
    "F♯": "G" + FLAT,
    "G♯": "A" + FLAT,
    "A♯": "B" + FLAT
};

/**
 * Equivalent sharps for various notes.
 * @const
 * @type {Object.<string, string>}
 */
const EQUIVALENTSHARPS = {
    "D♭": "C" + SHARP,
    "E♭": "D" + SHARP,
    "G♭": "F" + SHARP,
    "A♭": "G" + SHARP,
    "B♭": "A" + SHARP
};

/**
 * Maps from notes with specific accidentals to their equivalent natural notes.
 * @constant {Object.<string, string>}
 */
const EQUIVALENTNATURALS = { "E♯": "F", "B♯": "C", "C♭": "B", "F♭": "E" };

/**
 * Maps from natural notes to their equivalent notes with specific accidentals.
 * @constant {Object.<string, string>}
 */
const EQUIVALENTACCIDENTALS = { F: "E♯", C: "B♯", B: "C♭", E: "F♭", G: "F𝄪", D: "C𝄪", A: "G𝄪" };

/**
 * Converts a note down to a flat note.
 * @const
 * @type {Object.<string, string>}
 */
const CONVERT_DOWN = {
    "C": "B" + SHARP,
    "C♭": "B",
    "D♭": "C" + SHARP,
    "E♭": "D" + SHARP,
    "F": "E" + SHARP,
    "F♭": "E",
    "G♭": "F" + SHARP,
    "A♭": "G" + SHARP,
    "B♭": "A" + SHARP
};

/**
 * Maps from notes with specific accidentals to their equivalent notes after a double-down transposition.
 * @constant {Object.<string, string>}
 */
const CONVERT_DOUBLE_DOWN = {
    "C♯": "B" + DOUBLESHARP,
    "D": "C" + DOUBLESHARP,
    "E": "D" + DOUBLESHARP,
    "F♯": "E" + DOUBLESHARP,
    "G": "F" + DOUBLESHARP,
    "A": "G" + DOUBLESHARP,
    "B": "A" + DOUBLESHARP
};

/**
 * Maps from notes with specific accidentals to their equivalent notes after an up transposition.
 * @constant {Object.<string, string>}
 */
const CONVERT_UP = {
    "C♯": "D" + FLAT,
    "D♯": "E" + FLAT,
    "E♯": "F",
    "E": "F" + FLAT,
    "F♯": "G" + FLAT,
    "G♯": "A" + FLAT,
    "A♯": "B" + FLAT,
    "B♯": "C",
    "B": "C" + FLAT,
};

/**
 * Maps from notes with specific accidentals to their equivalent notes after a double-up transposition.
 * @constant {Object.<string, string>}
 */
const CONVERT_DOUBLE_UP = {
    "C": "D" + DOUBLEFLAT,
    "D": "E" + DOUBLEFLAT,
    "E♭": "F" + DOUBLEFLAT,
    "F": "G" + DOUBLEFLAT,
    "G": "A" + DOUBLEFLAT,
    "A": "B" + DOUBLEFLAT,
    "B♭": "C" + DOUBLEFLAT
};

/**
 * Extra transpositions for specific notes with accidentals.
 * @constant {Object.<string, [string, number]>}
 */
const EXTRATRANSPOSITIONS = {
    "E♯": ["F", 0],
    "B♯": ["C", 1],
    "C♭": ["B", -1],
    "F♭": ["E", 0],
    "e♯": ["F", 0],
    "b♯": ["C", 1],
    "c♭": ["B", -1],
    "f♭": ["E", 0]
};

/**
 * Array containing the solfege names for the diatonic scale.
 * @constant {string[]}
 */
const SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti"];

/**
 * Array containing the solfege names for the chromatic scale.
 * @constant {string[]}
 */
const SOLFEGENAMES1 = [
    "do",
    "do" + SHARP,
    "do" + DOUBLESHARP,
    "re" + DOUBLEFLAT,
    "re" + FLAT,
    "re",
    "re" + SHARP,
    "re" + DOUBLESHARP,
    "mi" + DOUBLEFLAT,
    "mi" + FLAT,
    "mi",
    "fa",
    "fa" + SHARP,
    "fa" + DOUBLESHARP,
    "sol" + DOUBLEFLAT,
    "sol" + FLAT,
    "sol",
    "sol" + SHARP,
    "sol" + DOUBLESHARP,
    "la",
    "la" + DOUBLEFLAT,
    "la" + FLAT,
    "la" + SHARP,
    "la" + DOUBLESHARP,
    "ti" + DOUBLEFLAT,
    "ti" + FLAT,
    "ti"
];

/**
 * Array containing the basic note names (without accidentals).
 * @constant {string[]}
 */
const NOTENAMES = ["C", "D", "E", "F", "G", "A", "B"];

/**
 * Array containing all possible note names, including double sharps/flats and triple sharps/flats.
 * @constant {string[]}
 */
const ALLNOTENAMES = [
    "C",
    "C#",
    "Cx",
    "Dbb",
    "Db",
    "D",
    "D#",
    "Dx",
    "Ebb",
    "Eb",
    "E",
    "E#",
    "Ex",
    "Fbb",
    "Fb",
    "F",
    "F#",
    "Fx",
    "Gbb",
    "Gb",
    "G",
    "G#",
    "Gx",
    "Abb",
    "Ab",
    "A",
    "A#",
    "Ax",
    "Bbb",
    "Bb",
    "B",
    "B#",
    "Bx",
    "Cbb",
    "Cb"
];

/**
 * Array containing note names with various accidentals (sharps and flats).
 * @constant {string[]}
 */
const NOTENAMES1 = [
    "C",
    "C" + SHARP,
    "C" + DOUBLESHARP,
    "D" + DOUBLEFLAT,
    "D" + FLAT,
    "D",
    "D" + SHARP,
    "D" + DOUBLESHARP,
    "E" + DOUBLEFLAT,
    "E" + FLAT,
    "E",
    "F",
    "F" + SHARP,
    "F" + DOUBLESHARP,
    "G" + DOUBLEFLAT,
    "G" + FLAT,
    "G",
    "G" + SHARP,
    "G" + DOUBLESHARP,
    "A",
    "A" + DOUBLEFLAT,
    "A" + FLAT,
    "A" + SHARP,
    "A" + DOUBLESHARP,
    "B" + DOUBLEFLAT,
    "B" + FLAT,
    "B"
];

/**
 * Maps from Western note names to their corresponding solfege names.
 * @constant {Object.<string, string>}
 */
const SOLFEGECONVERSIONTABLE = {
    "C": "do",
    "C♯": "do" + SHARP,
    "D": "re",
    "D♯": "re" + SHARP,
    "E": "mi",
    "F": "fa",
    "F♯": "fa" + SHARP,
    "G": "sol",
    "G♯": "sol" + SHARP,
    "A": "la",
    "A♯": "la" + SHARP,
    "B": "ti",
    "D♭": "re" + FLAT,
    "E♭": "mi" + FLAT,
    "G♭": "sol" + FLAT,
    "A♭": "la" + FLAT,
    "B♭": "ti" + FLAT,
    "R": _("rest")
};

/**
 * Maps from Western solfege names to their corresponding Carnatic solfege names.
 * @constant {Object.<string, string>}
 */
const WESTERN2EISOLFEGENAMES = {
    do: "sa",
    re: "re",
    mi: "ga",
    fa: "ma",
    sol: "pa",
    la: "dha",
    ti: "ni"
};

/**
 * Array containing pitches with flats.
 * @constant {string[]}
 */
const PITCHES = [
    "C",
    "D" + FLAT,
    "D",
    "E" + FLAT,
    "E",
    "F",
    "G" + FLAT,
    "G",
    "A" + FLAT,
    "A",
    "B" + FLAT,
    "B"
];

/**
 * Array containing pitches with flats and sharps.
 * @constant {string[]}
 */
const PITCHES1 = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

/**
 * Array containing pitches with sharps.
 * @constant {string[]}
 */
const PITCHES2 = [
    "C",
    "C" + SHARP,
    "D",
    "D" + SHARP,
    "E",
    "F",
    "F" + SHARP,
    "G",
    "G" + SHARP,
    "A",
    "A" + SHARP,
    "B"
];

/**
 * Array containing pitches with sharps.
 * @constant {string[]}
 */
const PITCHES3 = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * Maps from numerical values to solfege names.
 * @constant {Object.<number, string>}
 */
const NOTESTABLE = {
    1: "do",
    2: "do" + SHARP,
    3: "re",
    4: "re" + SHARP,
    5: "mi",
    6: "fa",
    7: "fa" + SHARP,
    8: "sol",
    9: "sol" + SHARP,
    10: "la",
    11: "la" + SHARP,
    0: "ti"
};

/**
 * Maps from fixed solfege names to their corresponding Western note names.
 * @constant {Object.<string, string>}
 */
const FIXEDSOLFEGE = {
    do: "C",
    re: "D",
    mi: "E",
    fa: "F",
    sol: "G",
    la: "A",
    ti: "B"
};

/**
 * Maps from fixed solfege names with accidentals to their corresponding Western note names.
 * @constant {Object.<string, string>}
 */
const FIXEDSOLFEGE1 = {
    "do𝄫": "B",
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
    "mi𝄪": "G",
    "fa𝄫": "E" + FLAT,
    "fa♭": "F" + FLAT,
    "fa": "F",
    "fa♯": "F" + SHARP,
    "fa𝄪": "G" + SHARP,
    "sol𝄫": "E",
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
    "ti𝄪": "C",
    "R": _("rest")
};

/**
 * Maps from note names to their corresponding step numbers.
 * @constant {Object.<string, number>}
 */
const NOTESTEP = { C: 1, D: 3, E: 5, F: 6, G: 8, A: 10, B: 12 };

/**
 * Array containing preferences for keys with sharps.
 * @constant {string[]}
 */
const SHARPPREFERENCE = [
    "g major",
    "d major",
    "a major",
    "e major",
    "b major",
    "f# major",
    "c# major",
    "e minor",
    "b minor",
    "f# minor",
    "c# minor",
    "g# minor",
    "d# minor"
];

/**
 * Array containing preferences for keys with flats.
 * @constant {string[]}
 */
const FLATPREFERENCE = [
    "f major",
    "bb major",
    "eb major",
    "ab major",
    "db major",
    "gb major",
    "cb major",
    "d minor",
    "g minor",
    "c minor",
    "f minor",
    "bb minor",
    "eb minor",
    "d harmonic minor",
    "g harmonic minor",
    "c harmonic minor",
    "f harmonic minor",
    "bb harmonic minor",
    "eb harmonic minor"
];

/**
 * Internal representation of solfege notes used in selectors.
 * @constant {string[]}
 */
const SOLFNOTES = ["ti", "la", "sol", "fa", "mi", "re", "do"];

/**
 * Scale notes used in selectors.
 * @constant {string[]}
 */
const SCALENOTES = ["7", "6", "5", "4", "3", "2", "1"];

/**
 * Carnatic solfege notes.
 * @constant {string[]}
 */
const EASTINDIANSOLFNOTES = ["ni", "dha", "pa", "ma", "ga", "re", "sa"];

/**
 * Drum names used in selectors.
 * @constant {string[]}
 */
const DRUMS = [
    "snare drum",
    "kick drum",
    "tom tom",
    "floor tom",
    "bass drum",
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
    "slap"
];

/**
 * Graphics names used in selectors.
 * @constant {string[]}
 */
const GRAPHICS = [
    "forward",
    "back",
    "right",
    "left",
    "set heading",
    "set color",
    "set shade",
    "set hue",
    "set grey",
    "set translucency",
    "set pen size"
];

//The "original solfege" https://en.wikipedia.org/wiki/Solf%C3%A8ge#Origin
// const ARETINIANSOLFNOTES = ['si', 'la', 'sol', 'fa', 'mi', 're', 'ut'];
// https://en.wikipedia.org/wiki/Iroha
// const IROHASOLFNOTES = ['ro', 'i', 'to', 'he', 'ho', 'ni', 'ha'];
// const IROHASOLFNOTESJA = ['ロ','イ','ト','へ','ホ','二','ハ'];

/**
 * Solfège attributes including double sharp, sharp, natural, flat, and double flat.
 * @constant {string[]}
 */
const SOLFATTRS = [DOUBLESHARP, SHARP, NATURAL, FLAT, DOUBLEFLAT];

//.TRANS: ordinal number. Please keep exactly one space between each number.
/**
 * Ordinal numbers for degrees.
 * @constant {string}
 */
const DEGREES = _("1st 2nd 3rd 4th 5th 6th 7th 8th 9th 10th 11th 12th");

/**
 * Number of semitones in an octave.
 * @constant {number}
 */
const SEMITONES = 12;

/**
 * Array representing powers of 2.
 * @constant {number[]}
 */
const POWER2 = [1, 2, 4, 8, 16, 32, 64, 128];

// eslint-disable-next-line no-loss-of-precision
const TWELTHROOT2 = 1.0594630943592953;
// eslint-disable-next-line no-loss-of-precision
const TWELVEHUNDRETHROOT2 = 1.0005777895065549;
const A0 = 27.5;
const C8 = 4186.01;

/**
 * Octave ratio.
 * @type {number}
 */
let octaveRatio = 2;

/**
 * Height of the rhythm ruler.
 * @constant {number}
 */
const RHYTHMRULERHEIGHT = 100;

/**
 * Height of a staff note.
 * @constant {number}
 */
const YSTAFFNOTEHEIGHT = 12.5;

/**
 * Height of a staff octave.
 * @constant {number}
 */
const YSTAFFOCTAVEHEIGHT = 87.5;

/**
 * Height of a slider.
 * @constant {number}
 */
const SLIDERHEIGHT = 200;

/**
 * Width of a slider.
 * @constant {number}
 */
const SLIDERWIDTH = 50;

/**
 * Color of matrix buttons.
 * @constant {string}
 */
const MATRIXBUTTONCOLOR = "#c374e9";

/**
 * Color of matrix labels.
 * @constant {string}
 */
const MATRIXLABELCOLOR = "#90c100";

/**
 * Color of matrix note cells.
 * @constant {string}
 */
const MATRIXNOTECELLCOLOR = "#b1db00";

/**
 * Color of matrix tuplet cells.
 * @constant {string}
 */
const MATRIXTUPLETCELLCOLOR = "#57e751";

/**
 * Color of matrix rhythm cells.
 * @constant {string}
 */
const MATRIXRHYTHMCELLCOLOR = "#c8c8c8";

/**
 * Hover color of matrix buttons.
 * @constant {string}
 */
const MATRIXBUTTONCOLORHOVER = "#c894e0";

/**
 * Hover color of matrix note cells.
 * @constant {string}
 */
const MATRIXNOTECELLCOLORHOVER = "#c2e820";

/**
 * Width of matrix solfege.
 * @constant {number}
 */
const MATRIXSOLFEWIDTH = 52;

/**
 * Width of an eighth note.
 * @constant {number}
 */
const EIGHTHNOTEWIDTH = 24;

/**
 * Height of matrix buttons.
 * @constant {number}
 */
const MATRIXBUTTONHEIGHT = 40;

/**
 * Height of matrix buttons.
 * @constant {number}
 */
const MATRIXBUTTONHEIGHT2 = 66;

/**
 * Height of matrix solfege.
 * @constant {number}
 */
const MATRIXSOLFEHEIGHT = 30;

/**
 * Image URL for a whole note.
 * @constant {string}
 */
const wholeNoteImg =
    "data:image/svg+xml;base64," + window.btoa(base64Encode(WHOLENOTE));
const halfNoteImg =
    "data:image/svg+xml;base64," + window.btoa(base64Encode(HALFNOTE));
const quarterNoteImg =
    "data:image/svg+xml;base64," + window.btoa(base64Encode(QUARTERNOTE));
const eighthNoteImg =
    "data:image/svg+xml;base64," + window.btoa(base64Encode(EIGHTHNOTE));
const sixteenthNoteImg =
    "data:image/svg+xml;base64," + window.btoa(base64Encode(SIXTEENTHNOTE));
const thirtysecondNoteImg =
    "data:image/svg+xml;base64," + window.btoa(base64Encode(THIRTYSECONDNOTE));
const sixtyfourthNoteImg =
    "data:image/svg+xml;base64," + window.btoa(base64Encode(SIXTYFOURTHNOTE));

/**
 * Map from note duration to corresponding note symbols.
 * @constant {Object.<number, string>}
 */    
const NOTESYMBOLS = {
    1: wholeNoteImg,
    2: halfNoteImg,
    4: quarterNoteImg,
    8: eighthNoteImg,
    16: sixteenthNoteImg,
    32: thirtysecondNoteImg,
    64: sixtyfourthNoteImg
};

/**
 * Musical terms used in selectors that may require translation.
 * @constant {Array<string>}
 */
const SELECTORSTRINGS = [
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
    _("meantone"),
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
const ACCIDENTALLABELS = [
    _("double sharp") + " " + DOUBLESHARP,
    _("sharp") + " " + SHARP,
    _("natural") + " " + NATURAL,
    _("flat") + " " + FLAT,
    _("double flat") + " " + DOUBLEFLAT
];

/**
 * Names and symbols for accidentals.
 * @constant {Array<string>}
 */
const ACCIDENTALNAMES = [
    "double sharp" + " " + DOUBLESHARP,
    "sharp" + " " + SHARP,
    "natural" + " " + NATURAL,
    "flat" + " " + FLAT,
    "double flat" + " " + DOUBLEFLAT
];

/**
 * Numeric values associated with accidentals.
 * @constant {Array<number>}
 */
const ACCIDENTALVALUES = [2, 1, 0, -1, -2];

/**
 * Names of various chord types.
 * @constant {Array<string>}
 */
const CHORDNAMES = [
    // scalar
    "triad (root position)",
    "triad (1st inversion)",
    "triad (2nd inversion)",
    "seventh (root position)",
    "seventh (1st inversion)",
    "seventh (2nd inversion)",
    "seventh (3rd inversion)",
    "ninth (root position)",
    "thirteenth (root position)",
    // semitone
    "major",
    "minor",
    "augmented",
    "diminished",
    "major 7th",
    "minor 7th",
    "dominant 7th",
    "minor-major 7th",
    "fully-diminished 7th",
    "half-diminished 7th",
    // custom must always be at the end of the list.
    "custom"
];

/**
 * Default chord for the "major" scale.
 * @constant {string}
 */
const DEFAULTCHORD = CHORDNAMES[9];

/**
 * Numeric values representing the intervals in different chords.
 * @constant {Array<Array<Array<number>>>}
 */
const CHORDVALUES = [
    //scalar
    [[0, 0], [2, 0], [4, 0]],
    [[2, 0], [4, 0], [7, 0]],
    [[-3, 0], [0, 0], [2, 0]],
    [[0, 0], [2, 0], [4, 0], [6, 0]],
    [[2, 0], [4, 0], [6, 0], [7, 0]],
    [[-3, 0], [-1, 0], [0, 0], [2, 0]],
    [[-1, 0], [0, 0], [2, 0], [4, 0]],
    [[0, 0], [2, 0], [4, 0], [6, 0], [8, 0]],
    [[0, 0], [2, 0], [4, 0], [6, 0], [12, 0]],
    //semitone
    [[0, 0], [0, 4], [0, 7]],
    [[0, 0], [0, 3], [0, 7]],
    [[0, 0], [0, 4], [0, 8]],
    [[0, 0], [0, 3], [0, 6]],
    [[0, 0], [0, 4], [0, 7], [0, 11]],
    [[0, 0], [0, 3], [0, 7], [0, 10]],
    [[0, 0], [0, 4], [0, 7], [0, 10]],
    [[0, 0], [0, 3], [0, 7], [0, 11]],
    [[0, 0], [0, 3], [0, 6], [0, 9]],
    [[0, 0], [0, 3], [0, 6], [0, 10]],
    // custom is always at the end of the list
    [[0, 0], [0, 4], [0, 7]],
];

/**
 * Set a custom chord.
 * @function
 * @param {Array<Array<number>>} chord - Custom chord values.
 */
const setCustomChord = (chord) => {
    CHORDVALUES[CHORDVALUES.length - 1] = chord;
};

/**
 * Modes for inverting chords.
 * @constant {Array<Array<string>>}
 */
const INVERTMODES = [
    [_("even"), "even"],
    [_("odd"), "odd"],
    [_("scalar"), "scalar"]
];

/**
 * Musical intervals and their characteristics.
 * @constant {Array<Array<string>>}
 */
const INTERVALS = [
    [_("perfect"), "perfect", [1, 4, 5, 8]],
    [_("minor"), "minor", [2, 3, 6, 7]],
    [_("diminished"), "diminished", [2, 3, 4, 5, 6, 7, 8]],
    [_("augmented"), "augmented", [1, 2, 3, 4, 5, 6, 7, 8]],
    [_("major"), "major", [2, 3, 6, 7]]
];

/**
 * Values associated with specific musical intervals.
 * @constant {Object}
 */
const INTERVALVALUES = {
    "perfect 1": [0, 0, 1 / 1],
    "diminished 2": [0, -1, 128 / 125],
    "augmented 1": [1, 1, 25 / 24],
    "chromatic semitone": [1, 1, 25 / 24],
    "minor 2": [1, -1, 16 / 15],
    "major 2": [2, 1, 9 / 8],
    "whole tone": [2, 1, 9 / 8],
    "diminished 3": [2, -1, 144 / 125],
    "augmented 2": [3, 1, 75 / 64],
    "minor 3": [3, -1, 6 / 5],
    "major 3": [4, 1, 5 / 4],
    "diminished 4": [4, -1, 32 / 25],
    "augmented 3": [5, 1, 125 / 96],
    "perfect 4": [5, 0, 4 / 3],
    "augmented 4": [6, 1, 25 / 18],
    "diminished 5": [6, -1, 36 / 25],
    "perfect 5": [7, 0, 3 / 2],
    "diminished 6": [7, -1, 192 / 125],
    "augmented 5": [8, 1, 25 / 16],
    "minor 6": [8, -1, 8 / 5],
    "major 6": [9, 1, 5 / 3],
    "diminished 7": [9, -1, 9 / 5],
    "augmented 6": [10, 1, 125 / 72],
    "minor 7": [10, -1, 9 / 5],
    "major 7": [11, 1, 15 / 8],
    "diminished 8": [11, -1, 48 / 25],
    "diminished octave": [11, -1, 48 / 25],
    "augmented 7": [12, 1, 125 / 64],
    "perfect 8": [12, 0, 2 / 1],
    "octave": [12, 0, 2 / 1],
    "augmented 8": [13, 1, 25 / 12]
};

/**
 * Modes available in the pie menu associated with the mode name block.
 * @constant {Object}
 */
const MODE_PIE_MENUS = {
    "5": [
        "minor pentatonic",
        "major pentatonic",
        " ",
        "chinese",
        "egyptian",
        " ",
        "hirajoshi",
        "in",
        "minyo",
        " ",
        "fibonacci",
        " "
    ],
    "6": ["minor blues", " ", " ", " ", "major blues", " ", " ", " ", "whole tone", " ", " ", " "],
    "7": [
        "ionian",
        " ",
        "dorian",
        " ",
        "phrygian",
        "lydian",
        " ",
        "mixolydian",
        " ",
        "aeolian",
        " ",
        "locrian"
    ],
    "7a": [
        "major",
        " ",
        "harmonic major",
        " ",
        "natural minor",
        " ",
        "harmonic minor",
        " ",
        "melodic minor",
        " ",
        " ",
        " "
    ],
    "7b": [
        "jazz minor",
        " ",
        "arabic",
        "byzantine",
        "enigmatic",
        "ethiopian",
        "geez",
        "hindu",
        "hungarian",
        "maqam",
        "romanian minor",
        "spanish gypsy"
    ],
    "8": [
        "octatonic",
        " ",
        "spanish",
        " ",
        "bebop",
        " ",
        "diminished",
        " ",
        " ",
        "algerian",
        " ",
        " "
    ],
    "12": ["chromatic", " ", " ", " ", " ", " ", "custom", " ", " ", " ", " ", " "]
};

// The table contains the intervals that define the modes.
// All of these modes assume 12 semitones per octave.
// See http://www.pianoscales.org <== this is in no way definitive
// TODO: better system of organizing and naming collections of pitches
const MUSICALMODES = {
    // 12 notes in an octave
    "chromatic": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],

    // 8 notes in an octave
    "algerian": [2, 1, 2, 1, 1, 1, 3, 1],
    "diminished": [2, 1, 2, 1, 2, 1, 2, 1],
    "spanish": [1, 2, 1, 1, 1, 2, 2, 2],
    "octatonic": [1, 2, 1, 2, 1, 2, 1, 2],
    "bebop": [1, 1, 1, 2, 2, 1, 2, 2],

    // 7 notes in an octave
    "major": [2, 2, 1, 2, 2, 2, 1],
    "harmonic major": [2, 2, 1, 2, 1, 3, 1],
    "natural minor": [2, 1, 2, 2, 1, 2, 2],
    "harmonic minor": [2, 1, 2, 2, 1, 3, 1],
    "melodic minor": [2, 1, 2, 2, 2, 2, 1],

    "ionian": [2, 2, 1, 2, 2, 2, 1],
    "dorian": [2, 1, 2, 2, 2, 1, 2],
    "phrygian": [1, 2, 2, 2, 1, 2, 2],
    "lydian": [2, 2, 2, 1, 2, 2, 1],
    "mixolydian": [2, 2, 1, 2, 2, 1, 2],
    "minor": [2, 1, 2, 2, 1, 2, 2],
    "aeolian": [2, 1, 2, 2, 1, 2, 2],
    "locrian": [1, 2, 2, 1, 2, 2, 2],

    "jazz minor": [2, 1, 2, 2, 2, 2, 1],

    "arabic": [2, 2, 1, 1, 2, 2, 2],
    "byzantine": [1, 3, 1, 2, 1, 3, 1],
    "enigmatic": [1, 3, 2, 2, 2, 1, 1],
    "ethiopian": [2, 1, 2, 2, 1, 2, 2],
    "geez": [2, 1, 2, 2, 1, 2, 2],
    "hindu": [2, 2, 1, 2, 1, 2, 2],
    "hungarian": [2, 1, 3, 1, 1, 3, 1],
    "maqam": [1, 3, 1, 2, 1, 3, 1],
    "romanian minor": [2, 1, 3, 1, 2, 1, 2],
    "spanish gypsy": [1, 3, 1, 2, 1, 2, 2],

    // 6 notes in an octave
    "minor blues": [3, 2, 1, 1, 3, 2],
    "major blues": [2, 1, 1, 3, 2, 2],
    "whole tone": [2, 2, 2, 2, 2, 2],

    // 5 notes in an octave
    "major pentatonic": [2, 2, 3, 2, 3],
    "minor pentatonic": [3, 2, 2, 3, 2],
    "chinese": [4, 2, 1, 4, 1],
    "egyptian": [2, 3, 2, 3, 2],
    "hirajoshi": [1, 4, 1, 4, 2],
    "in": [1, 4, 2, 1, 4],
    "minyo": [3, 2, 2, 3, 2],
    "fibonacci": [1, 1, 2, 3, 5],
    "alt pentatonic": [2, 3, 2, 2, 3],

    // User definition overrides this constant
    "custom": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
};

/**
 * Maqam table mapping specific maqams to their corresponding keys.
 * @constant {Object}
 */
const MAQAMTABLE = {
    "hijaz kar": "C maqam",
    "hijaz kar maqam": "C maqam",
    "shahnaz": "D maqam",
    "maqam mustar": "Eb maqam",
    "maqam jiharkah": "F maqam",
    "shadd araban": "G maqam",
    "suzidil": "A maqam",
    "ajam": "Bb maqam",
    "ajam maqam": "Bb maqam"
};

/**
 * Filter types used in audio processing.
 * @constant {Array<Array<string>>}
 */
const FILTERTYPES = [
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
const OSCTYPES = [
    [_("sine"), "sine"],
    [_("square"), "square"],
    [_("triangle"), "triangle"],
    [_("sawtooth"), "sawtooth"]
];

/**
 * Initial temperaments available for selection.
 * @constant {Array<Array<string>>}
 */
const INITIALTEMPERAMENTS = [
    [_("equal"), "equal", "equal"],
    [_("just intonation"), "just intonation", "just intonation"],
    [_("Pythagorean"), "Pythagorean", "Pythagorean"],
    [_("meantone") + " (1/3)", "1/3 comma meantone", "meantone (1/3)"],
    [_("meantone") + " (1/4)", "1/4 comma meantone", "meantone (1/4)"]
];

/**
 * Array of available temperaments.
 * @type {Array<Array<string>>}
 */
let TEMPERAMENTS = [
    [_("equal"), "equal", "equal"],
    [_("just intonation"), "just intonation", "just intonation"],
    [_("Pythagorean"), "Pythagorean", "Pythagorean"],
    [_("meantone") + " (1/3)", "1/3 comma meantone", "meantone (1/3)"],
    [_("meantone") + " (1/4)", "1/4 comma meantone", "meantone (1/4)"],
    [_("custom"), "custom", "custom"]
];

/**
 * Predefined temperaments for quick access.
 * @constant {Object}
 */
const PreDefinedTemperaments = {
    "equal": true,
    "just intonation": true,
    "Pythagorean": true,
    "1/3 comma meantone": true,
    "1/4 comma meantone": true
};

/**
 * Temperament settings and interval ratios.
 * @constant {Object}
 */
const TEMPERAMENT = {
    "equal": {
        "perfect 1": Math.pow(2, 0 / 12),
        "minor 2": Math.pow(2, 1 / 12),
        "augmented 1": Math.pow(2, 1 / 12),
        "major 2": Math.pow(2, 2 / 12),
        "augmented 2": Math.pow(2, 3 / 12),
        "minor 3": Math.pow(2, 3 / 12),
        "major 3": Math.pow(2, 4 / 12),
        "augmented 3": Math.pow(2, 5 / 12),
        "diminished 4": Math.pow(2, 4 / 12),
        "perfect 4": Math.pow(2, 5 / 12),
        "augmented 4": Math.pow(2, 6 / 12),
        "diminished 5": Math.pow(2, 6 / 12),
        "perfect 5": Math.pow(2, 7 / 12),
        "augmented 5": Math.pow(2, 8 / 12),
        "minor 6": Math.pow(2, 8 / 12),
        "major 6": Math.pow(2, 9 / 12),
        "augmented 6": Math.pow(2, 10 / 12),
        "minor 7": Math.pow(2, 10 / 12),
        "major 7": Math.pow(2, 11 / 12),
        "augmented 7": Math.pow(2, 12 / 12),
        "diminished 8": Math.pow(2, 11 / 12),
        "perfect 8": Math.pow(2, 12 / 12),
        "pitchNumber": 12,
        "interval": [
            "perfect 1",
            "minor 2",
            "major 2",
            "minor 3",
            "major 3",
            "perfect 4",
            "diminished 5",
            "perfect 5",
            "minor 6",
            "major 6",
            "minor 7",
            "major 7",
            "perfect 8"
        ]
    },
    "just intonation": {
        "perfect 1": 1 / 1,
        "minor 2": 16 / 15,
        "augmented 1": 16 / 15,
        "major 2": 9 / 8,
        "augmented 2": 6 / 5,
        "minor 3": 6 / 5,
        "major 3": 5 / 4,
        "augmented 3": 4 / 3,
        "diminished 4": 5 / 4,
        "perfect 4": 4 / 3,
        "augmented 4": 7 / 5,
        "diminished 5": 7 / 5,
        "perfect 5": 3 / 2,
        "augmented 5": 8 / 5,
        "minor 6": 8 / 5,
        "major 6": 5 / 3,
        "augmented 6": 16 / 9,
        "minor 7": 16 / 9,
        "major 7": 15 / 8,
        "augmented 7": 2 / 1,
        "diminished 8": 15 / 8,
        "perfect 8": 2 / 1,
        "pitchNumber": 12,
        "interval": [
            "perfect 1",
            "minor 2",
            "major 2",
            "minor 3",
            "major 3",
            "perfect 4",
            "diminished 5",
            "perfect 5",
            "minor 6",
            "major 6",
            "minor 7",
            "major 7",
            "perfect 8"
        ]
    },
    "Pythagorean": {
        "perfect 1": 1 / 1,
        "minor 2": 256 / 243,
        "augmented 1": 256 / 243,
        "major 2": 9 / 8,
        "augmented 2": 32 / 27,
        "minor 3": 32 / 27,
        "major 3": 81 / 64,
        "augmented 3": 4 / 3,
        "diminished 4": 81 / 64,
        "perfect 4": 4 / 3,
        "augmented 4": 729 / 512,
        "diminished 5": 729 / 512,
        "perfect 5": 3 / 2,
        "augmented 5": 128 / 81,
        "minor 6": 128 / 81,
        "major 6": 27 / 16,
        "augmented 6": 16 / 9,
        "minor 7": 16 / 9,
        "major 7": 243 / 128,
        "augmented 7": 2 / 1,
        "diminished 8": 243 / 128,
        "perfect 8": 2 / 1,
        "pitchNumber": 12,
        "interval": [
            "perfect 1",
            "minor 2",
            "major 2",
            "minor 3",
            "major 3",
            "perfect 4",
            "diminished 5",
            "perfect 5",
            "minor 6",
            "major 6",
            "minor 7",
            "major 7",
            "perfect 8"
        ]
    },
    "1/3 comma meantone": {
        // 19-EDO
        "perfect 1": 1 / 1,
        "minor 2": 1.075693,
        "augmented 1": 1.037156,
        "major 2": 1.115656,
        "augmented 2": 1.157109,
        "minor 3": 1.200103,
        "major 3": 1.244694,
        "augmented 3": 1.290943,
        "diminished 4": 1.290943,
        "perfect 4": 1.338902,
        "augmented 4": 1.38865,
        "diminished 5": 1.440247,
        "perfect 5": 1.493762,
        "augmented 5": 1.549255,
        "minor 6": 1.60682,
        "major 6": 1.666524,
        "augmented 6": 1.728445,
        "minor 7": 1.792668,
        "major 7": 1.859266,
        "augmented 7": 1.92835,
        "diminished 8": 1.92835,
        "perfect 8": 2 / 1,
        "pitchNumber": 19,
        "interval": [
            "perfect 1",
            "augmented 1",
            "minor 2",
            "major 2",
            "augmented 2",
            "minor 3",
            "major 3",
            "diminished 4",
            "perfect 4",
            "augmented 4",
            "diminished 5",
            "perfect 5",
            "augmented 5",
            "minor 6",
            "major 6",
            "augmented 6",
            "minor 7",
            "major 7",
            "diminished 8",
            "perfect 8"
        ]
    },
    "1/4 comma meantone": {
        // 21 notes per octave
        "perfect 1": 1 / 1,
        "minor 2": 16 / 15,
        "augmented 1": 25 / 24,
        "major 2": 9 / 8,
        "augmented 2": 75 / 64,
        "minor 3": 6 / 5,
        "major 3": 5 / 4,
        "diminished 4": 32 / 25,
        "augmented 3": 125 / 96,
        "perfect 4": 4 / 3,
        "augmented 4": 25 / 18,
        "diminished 5": 36 / 25,
        "perfect 5": 3 / 2,
        "augmented 5": 25 / 16,
        "minor 6": 8 / 5,
        "major 6": 5 / 3,
        "augmented 6": 125 / 72,
        "minor 7": 9 / 5,
        "major 7": 15 / 8,
        "diminished 8": 48 / 25,
        "augmented 7": 125 / 64,
        "perfect 8": 2 / 1,
        "pitchNumber": 21,
        "interval": [
            "perfect 1",
            "augmented 1",
            "minor 2",
            "major 2",
            "augmented 2",
            "minor 3",
            "major 3",
            "diminished 4",
            "augmented 3",
            "perfect 4",
            "augmented 4",
            "diminished 5",
            "perfect 5",
            "augmented 5",
            "minor 6",
            "major 6",
            "augmented 6",
            "minor 7",
            "major 7",
            "diminished 8",
            "augmented 7",
            "perfect 8"
        ]
    },
    "custom": {
        0: Math.pow(2, 0 / 12),
        1: Math.pow(2, 1 / 12),
        2: Math.pow(2, 2 / 12),
        3: Math.pow(2, 3 / 12),
        4: Math.pow(2, 4 / 12),
        5: Math.pow(2, 5 / 12),
        6: Math.pow(2, 6 / 12),
        7: Math.pow(2, 7 / 12),
        8: Math.pow(2, 8 / 12),
        9: Math.pow(2, 9 / 12),
        10: Math.pow(2, 10 / 12),
        11: Math.pow(2, 11 / 12),
        pitchNumber: 12,
        interval: [
            "perfect 1",
            "minor 2",
            "major 2",
            "minor 3",
            "major 3",
            "perfect 4",
            "diminished 5",
            "perfect 5",
            "minor 6",
            "major 6",
            "minor 7",
            "major 7",
            "perfect 8"
        ]
    }
};

/**
 * Set the global octave ratio.
 * @function
 * @param {number} newOctaveRatio - The new octave ratio to set.
 * @returns {void}
 */
const setOctaveRatio = (newOctaveRatio) => {
    octaveRatio = newOctaveRatio;
};

/**
 * Get the current global octave ratio.
 * @function
 * @returns {number} The current octave ratio.
 */
const getOctaveRatio = () => {
    return octaveRatio;
};

/**
 * Get the list of available temperaments.
 * @function
 * @returns {Array<Array<string>>} The list of available temperaments.
 */
const getTemperamentsList = () => {
    return TEMPERAMENTS;
};

/**
 * Get the interval ratios for a specific temperament.
 * @function
 * @param {string} entry - The name of the temperament.
 * @returns {Object} The interval ratios for the specified temperament.
 */
const getTemperament = (entry) => {
    return TEMPERAMENT[entry];
};

/**
 * Get the keys of the temperament dictionary.
 * @function
 * @returns {Array<string>} The keys of the temperament dictionary.
 */
const getTemperamentKeys = () => {
    const keys = [];
    for (const k in TEMPERAMENT) {
        keys.push(k);
    }

    return keys;
};

/**
 * Add a new temperament entry to the list.
 * @function
 * @param {Array<string>} newEntry - The new temperament entry to add.
 * @returns {void}
 */
const addTemperamentToList = (newEntry) => {
    for (let i = 0; i < TEMPERAMENTS.length; i++) {
        if (PreDefinedTemperaments[i] === newEntry) {
            return;
        }
    }
    TEMPERAMENTS.push(newEntry);
};

/**
 * Delete a temperament entry from the list.
 * @function
 * @param {string} oldEntry - The name of the temperament to delete.
 * @returns {void}
 */
const deleteTemperamentFromList = (oldEntry) => {
    delete TEMPERAMENT[oldEntry];
};

/**
 * Add a new temperament entry to the dictionary.
 * @function
 * @param {string} entryName - The name of the temperament.
 * @param {Object} entryValue - The interval ratios for the temperament.
 * @returns {void}
 */
const addTemperamentToDictionary = (entryName, entryValue) => {
    TEMPERAMENT[entryName] = entryValue;
};

/**
 * Update the list of available temperaments.
 * @function
 * @returns {void}
 */
const updateTemperaments = () => {
    TEMPERAMENTS = [...INITIALTEMPERAMENTS];
    for (const i in TEMPERAMENT) {
        if (!(i in PreDefinedTemperaments)) {
            TEMPERAMENTS.push([_(i), i, i]);
        }
    }
};


/**
 * Default invert mode.
 * @constant {string}
 */
const DEFAULTINVERT = "even";
/**
 * Default interval for the mode.
 * @constant {string}
 */
const DEFAULTINTERVAL = "perfect" + " 5";
/**
 * Default voice for audio synthesis.
 * @constant {string}
 */
const DEFAULTVOICE = "electronic synth";
/**
 * Default noise type for audio synthesis.
 * @constant {string}
 */
const DEFAULTNOISE = "noise1";
/**
 * Default drum type for audio synthesis.
 * @constant {string}
 */
const DEFAULTDRUM = "kick drum";
/**
 * Default effect for audio synthesis.
 * @constant {string}
 */
const DEFAULTEFFECT = "duck";
/**
 * Default musical mode.
 * @constant {string}
 */
const DEFAULTMODE = "major";
/**
 * Default temperament.
 * @constant {string}
 */
const DEFAULTTEMPERAMENT = "equal";
/**
 * Default filter type for audio processing.
 * @constant {string}
 */
const DEFAULTFILTERTYPE = "highpass";
/**
 * Default oscillator type for audio synthesis.
 * @constant {string}
 */
const DEFAULTOSCILLATORTYPE = "sine";
/**
 * Default accidental for musical notation.
 * @constant {string}
 */
const DEFAULTACCIDENTAL = "natural" + " " + NATURAL;

/**
 * Custom mode from the musical modes dictionary.
 * @constant {Object}
 */
const customMode = MUSICALMODES["custom"];

/**
 * Get the invert mode name based on its identifier.
 * @function
 * @param {string} name - The identifier of the invert mode.
 * @returns {string} The name of the invert mode.
 */
const getInvertMode = (name) => {
    for (const interval in INVERTMODES) {
        if (
            INVERTMODES[interval][0] === name ||
            INVERTMODES[interval][1].toLowerCase() === name.toLowerCase()
        ) {
            if (INVERTMODES[interval][0] != "") {
                return INVERTMODES[interval][0];
            } else {
                return INVERTMODES[interval][1];
            }
        }
    }

    // console.debug(name + " not found in INVERTMODES");
    return name;
};

/**
 * Get the number of semi-tones for a specific interval.
 * @function
 * @param {string} name - The name of the interval.
 * @returns {number} The number of semi-tones for the interval.
 */
const getIntervalNumber = name => { return INTERVALVALUES[name][0]; };

/**
 * Get the direction of the interval (-1 down, 0 neutral, 1 up).
 * @function
 * @param {string} name - The name of the interval.
 * @returns {number} The direction of the interval.
 */
const getIntervalDirection = name =>  { return INTERVALVALUES[name][1];};

/**
 * Get the ratio for a specific interval.
 * @function
 * @param {string} name - The name of the interval.
 * @returns {number} The ratio for the interval.
 */
const getIntervalRatio = name => { return INTERVALVALUES[name][2];};


/**
 * Get the mode numbers for a specific mode name.
 * @function
 * @param {string} name - The name of the mode.
 * @returns {string} The mode numbers.
 */
const getModeNumbers = (name) => {
    const __convert =  obj => {
        let n = 0;
        let m = "";
        for (let i = 0; i < obj.length; i++) {
            m += n.toString();
            if (i < obj.length - 1) {
                m += " ";
            }

            n += obj[i];
        }

        return m;
    };

    for (const mode in MUSICALMODES) {
        if (mode === name.toLowerCase()) {
            return __convert(MUSICALMODES[mode]);
        }
    }

    // console.debug(name + " not found in MUSICALMODES");
    return "";
};

/**
 * Get the drum index based on its name.
 * @function
 * @param {string} name - The name of the drum.
 * @returns {number} The index of the drum, or -1 if not found.
 */
const getDrumIndex = (name) => {
    if (name === "") {
        // console.debug("getDrumName passed blank name. Returning " + DEFAULTDRUM);
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) === "http") {
        name = DEFAULTDRUM;
    }

    for (let drum = 0; drum < DRUMNAMES.length; drum++) {
        if (DRUMNAMES[drum][0].toLowerCase() === name.toLowerCase()) {
            return drum;
        } else if (DRUMNAMES[drum][1].toLowerCase() === name.toLowerCase()) {
            return drum;
        }
    }

    return -1;
};

/**
 * Get the drum name based on its identifier.
 * @function
 * @param {string} name - The identifier of the drum.
 * @returns {string|null} The name of the drum, or null if not found.
 */
const getDrumName = (name) => {
    if (name === "") {
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) === "http") {
        return null;
    }

    for (let drum = 0; drum < DRUMNAMES.length; drum++) {
        if (DRUMNAMES[drum][0].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[drum][0];
        } else if (DRUMNAMES[drum][1].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[drum][1];
        }
    }

    // console.debug(name + ' not found in DRUMNAMES');
    return null;
};

/**
 * Get the drum symbol based on its name.
 * @function
 * @param {string} name - The name of the drum.
 * @returns {string} The symbol of the drum, or "hh" if not found.
 */
const getDrumSymbol = (name) => {
    if (name === "") {
        return "hh";
    }

    for (let drum = 0; drum < DRUMNAMES.length; drum++) {
        if (DRUMNAMES[drum][0].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[drum][3];
        } else if (DRUMNAMES[drum][1].toLowerCase() === name.toLowerCase()) {
            return "hh";
        }
    }

    // console.debug(name + " not found in DRUMNAMES");
    return "hh";
};

/**
 * Get the filter type based on its name.
 * @function
 * @param {string} name - The name of the filter type.
 * @returns {string} The filter type, or the default filter type if not found.
 */
const getFilterTypes = (name) => {
    if (name === "") {
        name = DEFAULTFILTERTYPE;
    }

    for (let type = 0; type < FILTERTYPES.length; type++) {
        if (FILTERTYPES[type][0].toLowerCase() === name.toLowerCase()) {
            return FILTERTYPES[type][0];
        } else if (FILTERTYPES[type][1].toLowerCase() === name.toLowerCase()) {
            return FILTERTYPES[type][1];
        }
    }

    // console.debug(name + " not found in FILTERTYPES");
    return DEFAULTFILTERTYPE;
};

/**
 * Get the oscillator type based on its name.
 * @function
 * @param {string} name - The name of the oscillator type.
 * @returns {string|null} The oscillator type, or null if not found.
 */
const getOscillatorTypes = (name) => {
    if (name === "") {
        name = null; // DEFAULTOSCILLATORTYPE;
    }

    for (let type = 0; type < OSCTYPES.length; type++) {
        if (OSCTYPES[type][0].toLowerCase() === name.toLowerCase()) {
            return OSCTYPES[type][0];
        } else if (OSCTYPES[type][1].toLowerCase() === name.toLowerCase()) {
            return OSCTYPES[type][1];
        }
    }

    // console.debug(name + " not found in OSCTYPES");
    return null; // DEFAULTOSCILLATORTYPE;
};

/**
 * Get the drum icon file path based on its name.
 * @function
 * @param {string} name - The name of the drum.
 * @returns {string} The file path of the drum icon, or the default drum icon path if not found.
 */
const getDrumIcon = (name) => {
    if (name === "") {
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) === "http") {
        return "images/drum.svg";
    }

    for (let i = 0; i < DRUMNAMES.length; i++) {
        if (DRUMNAMES[i][0] === name || DRUMNAMES[i][1].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[i][2];
        }
    }

    // console.debug(name + " not found in DRUMNAMES");
    return "images/drum.svg";
};

/**
 * Get the drum synth name based on its identifier.
 * @function
 * @param {string} name - The identifier of the drum synth.
 * @returns {string|null} The name of the drum synth, or null if not found.
 */
const getDrumSynthName = (name) => {
    if (name === null || name === undefined) {
        // console.debug("getDrumSynthName passed null name. Returning null");
        return null;
    } else if (name === "") {
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) === "http") {
        return name;
    }

    for (let i = 0; i < DRUMNAMES.length; i++) {
        if (DRUMNAMES[i][0] === name || DRUMNAMES[i][1].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[i][1];
        }
    }

    // console.debug(name + " not found in DRUMNAMES");
    return DEFAULTDRUM;
};

/**
 * Get the noise name based on its identifier.
 * @function
 * @param {string} name - The identifier of the noise.
 * @returns {string} The name of the noise, or the default noise if not found.
 */
const getNoiseName = (name) => {
    if (name === "") {
        name = DEFAULTNOISE;
    }

    for (let i = 0; i < NOISENAMES.length; i++) {
        if (NOISENAMES[i][1] === name) {
            if (NOISENAMES[i][0] != "") {
                return NOISENAMES[i][0];
            } else {
                return NOISENAMES[i][1];
            }
        }
    }

    // console.debug(name + " not found in NOISENAMES");
    return DEFAULTNOISE;
};


/**
 * Get the noise icon file path based on its name.
 * @function
 * @param {string} name - The name of the noise.
 * @returns {string} The file path of the noise icon, or the default noise icon path if not found.
 */
const getNoiseIcon = (name) => {
    if (name === "") {
        name = DEFAULTNOISE;
    } else if (name.slice(0, 4) === "http") {
        return "images/noises.svg";
    }

    for (let i = 0; i < NOISENAMES.length; i++) {
        if (NOISENAMES[i][0] === name || NOISENAMES[i][1] === name) {
            return NOISENAMES[i][2];
        }
    }

    // console.debug(name + " not found in NOISENAMES");
    return "images/synth.svg";
};

/**
 * Get the noise synth name based on its identifier.
 * @function
 * @param {string|null} name - The identifier of the noise synth.
 * @returns {string|null} The name of the noise synth, or null if not found.
 */
const getNoiseSynthName = (name) => {
    if (name === null || name === undefined) {
        return null;
    } else if (name === "") {
        name = DEFAULTNOISE;
    }

    for (let i = 0; i < NOISENAMES.length; i++) {
        if (NOISENAMES[i][0] === name || NOISENAMES[i][1] === name) {
            return NOISENAMES[i][1];
        }
    }

    // console.debug(name + " not found in NOISENAMES");
    return DEFAULTNOISE;
};

/**
 * Get the voice name based on its identifier.
 * @function
 * @param {string} name - The identifier of the voice.
 * @returns {string|null} The name of the voice, or null if not found.
 */
const getVoiceName = (name) => {
    if (name === "") {
        name = DEFAULTVOICE;
    } else if (name.slice(0, 4) === "http") {
        return null;
    }

    for (let i = 0; i < VOICENAMES.length; i++) {
        if (VOICENAMES[i][0] === name) {
            if (VOICENAMES[i][0] != "") {
                return VOICENAMES[i][0];
            } else if (VOICENAMES[i][1] === name) {
                return VOICENAMES[i][1];
            }
        }
    }

    // console.debug(name + " not found in VOICENAMES");
    return DEFAULTVOICE;
};

/**
 * Get the voice icon file path based on its identifier.
 * @function
 * @param {string} name - The identifier of the voice.
 * @returns {string} The file path of the voice icon, or the default voice icon path if not found.
 */
const getVoiceIcon = (name) => {
    if (name === "") {
        name = DEFAULTVOICE;
    } else if (name.slice(0, 4) === "http") {
        return "images/voices.svg";
    }

    for (let i = 0; i < VOICENAMES.length; i++) {
        if (VOICENAMES[i][0] === name || VOICENAMES[i][1] === name) {
            return VOICENAMES[i][2];
        }
    }

    for (let i = 0; i < CUSTOMSAMPLES.length; i++) {
        if (CUSTOMSAMPLES[i][0] === name || CUSTOMSAMPLES[i][1] === name) {
            return CUSTOMSAMPLES[i][0];
        }
    }

    // console.debug(name + " not found in VOICENAMES");
    return "images/voices.svg";
};

/**
 * Get the voice synth name based on its identifier.
 * @function
 * @param {string|null} name - The identifier of the voice synth.
 * @returns {string|null} The name of the voice synth, or null if not found.
 */
const getVoiceSynthName = (name) => {
    if (name === null || name === undefined) {
        return null;
    } else if (name === "") {
        name = DEFAULTVOICE;
    } else if (name.slice(0, 4) === "http") {
        return name;
    }

    for (let i = 0; i < VOICENAMES.length; i++) {
        if (VOICENAMES[i][0] === name || VOICENAMES[i][1] === name) {
            return VOICENAMES[i][1];
        }
    }

    // console.debug(name + " not found in VOICENAMES");
    return DEFAULTVOICE;
};

/**
 * Check if a given temperament is custom.
 * @function
 * @param {string} temperament - The name of the temperament.
 * @returns {boolean} True if the temperament is custom, false otherwise.
 */
const isCustomTemperament = (temperament) => {
    return !(temperament in PreDefinedTemperaments);
};

/**
 * Get the name of a temperament based on its identifier.
 * @function
 * @param {string} name - The identifier of the temperament.
 * @returns {string} The name of the temperament, or the default temperament name if not found.
 */
const getTemperamentName = (name) => {
    if (name === "") {
        name = DEFAULTTEMPERAMENT;
    }

    for (let i = 0; i < TEMPERAMENTS.length; i++) {
        if (TEMPERAMENTS[i][0].toLowerCase() === name.toLowerCase()) {
            return TEMPERAMENTS[i][1];
        } else if (TEMPERAMENTS[i][1].toLowerCase() === name.toLowerCase()) {
            return TEMPERAMENTS[i][1];
        }
    }

    // console.debug(name + " not found in TEMPERAMENTS");
    return DEFAULTTEMPERAMENT;
};

/**
 * Convert a note string to an object containing the note, octave, and cents.
 * @function
 * @param {string} note - The note string.
 * @returns {Array} An array containing the note, octave, and cents.
 */
const noteToObj = (note) => {
    let octave = parseInt(note.slice(note.length - 1));
    if (isNaN(octave)) {
        octave = 4;
    } else {
        note = note.slice(0, note.length - 1);
    }
    return [note, octave];
};

/**
 * Convert a frequency to pitch, returning the note, octave, and cents.
 * @function
 * @param {number} hz - The frequency in hertz.
 * @returns {Array} An array containing the note, octave, and cents.
 */
const frequencyToPitch = (hz) => {
    // Calculate the pitch and octave based on frequency, rounding to
    // the nearest cent.

    if (hz < A0) {
        return ["A", 0, 0];
    } else if (hz > C8) {
        // FIXME: set upper bound of C10
        return ["C", 8, 0];
    }

    // Calculate cents to keep track of drift
    let cents = 0;
    for (let i = 0; i < 8 * 1200; i++) {
        const f = A0 * Math.pow(TWELVEHUNDRETHROOT2, i);
        if (hz < f * 1.0003 && hz > f * 0.9997) {
            cents = i % 100;
            if (cents > 50) {
                cents -= 100;
            }
            const j = Math.floor((i / 100) + 0.5);
            return [
                PITCHES[(j + PITCHES.indexOf("A")) % 12],
                Math.floor((j + PITCHES.indexOf("A")) / 12),
                cents
            ];
        }
    }

    // console.debug("Could not find note/octave/cents for " + hz);
    return ["?", -1, 0];
};

/**
 * Get the articulation symbols from a note string.
 * @function
 * @param {string} note - The note string.
 * @returns {string} The note string without articulation symbols.
 */
const getArticulation = (note) => {
    return note
        .replace("do", "")
        .replace("re", "")
        .replace("mi", "")
        .replace("fa", "")
        .replace("sol", "")
        .replace("la", "")
        .replace("ti", "")
        .replace("A", "")
        .replace("B", "")
        .replace("C", "")
        .replace("D", "")
        .replace("E", "")
        .replace("F", "")
        .replace("G", "")
        .replace("^^", "")  // up/down from custom notes
        .replace("vv", "")
        .replace("^", "")
        .replace("v", "");
};

/**
 * Convert a key signature to mode, returning an array with the key and mode.
 * @function
 * @param {string} keySignature - The key signature string.
 * @returns {Array} An array containing the key and mode.
 */
const keySignatureToMode = (keySignature) => {
    // Convert from "A Minor" to "A" and "MINOR"
    if (keySignature === "" || keySignature == null) {
        return ["C", "major"];
    }

    // Maqams have special names for certain keys.
    if (keySignature.toLowerCase() in MAQAMTABLE) {
        keySignature = MAQAMTABLE[keySignature.toLowerCase()];
    }

    let parts = keySignature.split(" ");

    // A special case to test: m used for minor.
    let minorMode = false;
    if (parts.length === 1 && parts[0][parts[0].length - 1] === "m") {
        minorMode = true;
        parts[0] = parts[0].slice(0, parts[0].length - 1);
    }

    let key;
    if (parts[0] in BTOFLAT) {
        key = BTOFLAT[parts[0]];
    } else if (parts[0] in STOSHARP) {
        key = STOSHARP[parts[0]];
    } else {
        key = parts[0];
    }

    if (key === "C" + FLAT) {
        parts = keySignature.split(" ");
        key = "C" + FLAT;
    } else if (key == "B" + SHARP) {
        parts = keySignature.split(" ");
        key = "B" + SHARP;
    } else if (key == "F" + FLAT) {
        parts = keySignature.split(" ");
        key = "F" + FLAT;
    } else if (SOLFEGENAMES1.indexOf(key) !== -1) {
        // This conversion will be a bit iffy depending upon the current mode.
        // eslint-disable-next-line no-use-before-define
        key = getNote(key, 4, 0, "C Major", false)[0];
    } else if (NOTESSHARP.indexOf(key) === -1 && NOTESFLAT.indexOf(key) === -1) {
        // eslint-disable-next-line no-console
        console.debug("Invalid key or missing name; reverting to C.");
        // Is is possible that the key was left out?
        keySignature = "C " + keySignature;
        parts = keySignature.split(" ");
        key = "C";
    }

    if (minorMode) {
        return [key, "natural minor"];
    }

    // Reassemble remaining parts to get mode name
    let mode = "";
    for (let i = 1; i < parts.length; i++) {
        if (parts[i] !== "") {
            if (mode === "") {
                mode = parts[i];
            } else {
                mode += " " + parts[i];
            }
        }
    }

    if (mode === "") {
        mode = "major";
    } else {
        mode = mode.toLowerCase();
    }

    if (mode in MUSICALMODES) {
        return [key, mode];
    } else {
        // eslint-disable-next-line no-console
        console.debug("Invalid mode name: " + mode + " reverting to major.");
        return [key, "major"];
    }
};

/**
 * Approximate mapping of mode to solfege (Used by modes where the
 * length !== 7).
 * @constant
 * @type {Array}
 */
const SOLFMAPPER = ["do", "do", "re", "re", "mi", "fa", "fa", "sol", "sol", "la", "la", "ti"];

/**
 * Get the scale and solfege with half-steps for a given key signature.
 * @function
 * @param {string} keySignature - The key signature string.
 * @returns {Array} An array containing the scale notes, solfege with half-steps, key signature, and mode.
 */
const getScaleAndHalfSteps = (keySignature) => {
    // Determine scale and half-step pattern from key signature
    const obj = keySignatureToMode(keySignature);
    let myKeySignature = obj[0];
    let halfSteps;
    if (obj[1] === "CUSTOM") {
        halfSteps = customMode;
    } else {
        halfSteps = MUSICALMODES[obj[1]];
    }

    const solfege = [];

    if (halfSteps.length === 7) {
        for (let i = 0; i < halfSteps.length; i++) {
            solfege.push(SOLFEGENAMES[i]);
            for (let j = 1; j < halfSteps[i]; j++) {
                solfege.push("");
            }
        }
    } else if (halfSteps.length > 7) {
        // If there are more than 7 notes, we need to add accidentals.
        for (let i = 0; i < halfSteps.length; i++) {
            if (solfege.indexOf(SOLFMAPPER[i]) === -1) {
                solfege.push(SOLFMAPPER[i]);
            } else {
                solfege.push(SOLFMAPPER[i] + SHARP);
            }

            for (let j = 1; j < halfSteps[i]; j++) {
                solfege.push("");
            }
        }
    } else {
        // If there are fewer than 7 notes, choose a solfege based on the mode spacing.
        let n;
        let solf;
        for (let i = 0; i < halfSteps.length; i++) {
            n = 0;
            solf = SOLFMAPPER[solfege.length];
            // Ensure there are no duplicates.
            while (solfege.indexOf(solf) !== -1) {
                n += 1;
                solf = SOLFMAPPER[solfege.length + n];
            }

            solfege.push(solf);

            for (let j = 1; j < halfSteps[i]; j++) {
                solfege.push("");
            }
        }
    }

    let thisScale = NOTESSHARP;
    if (NOTESFLAT.indexOf(myKeySignature) !== -1) {
        thisScale = NOTESFLAT;
    }

    if (myKeySignature in EXTRATRANSPOSITIONS) {
        myKeySignature = EXTRATRANSPOSITIONS[myKeySignature][0];
    }

    return [thisScale, solfege, myKeySignature, obj[1]];
};

/**
 * Map common modes into their major/minor equivalent.
 * @function
 * @param {string} key - The key of the mode.
 * @param {string} mode - The mode to map.
 * @returns {Array} An array containing the mapped key and mode.
 */
const modeMapper = (key, mode) => {
    // map common modes into their major/minor equivalent
    // console.debug(key + ' ' + mode + ' >>');
    key = key.toLowerCase();
    mode = mode.toLowerCase();

    switch (mode) {
        case "ionian":
            mode = "major";
            break;
        case "dorian":
            mode = "major";
            switch (key) {
                case "c":
                    key = "a" + SHARP;
                    break;
                case "d":
                    key = "c";
                    break;
                case "e":
                    key = "d";
                    break;
                case "f":
                    key = "c";
                    mode = "minor";
                    break;
                case "g":
                    key = "f";
                    break;
                case "a":
                    key = "g";
                    break;
                case "b":
                    key = "a";
                    break;
                case "c" + SHARP:
                    key = "b";
                    break;
                case "d" + SHARP:
                    key = "b";
                    break;
                case "f" + SHARP:
                    key = "f";
                    break;
                case "g" + SHARP:
                    key = "b";
                    break;
                case "a" + SHARP:
                    key = "g" + SHARP;
                    break;
                case "d" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
                case "e" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
                case "g" + FLAT:
                    key = "d";
                    mode = "minor";
                    break;
                case "a" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
                case "b" + FLAT:
                    key = "f";
                    mode = "minor";
                    break;
            }
            break;
        case "phrygian":
            mode = "major";
            switch (key) {
                case "c":
                    key = "g" + SHARP;
                    break;
                case "d":
                    key = "a" + SHARP;
                    break;
                case "e":
                    key = "c";
                    break;
                case "f":
                    key = "b";
                    break;
                case "g":
                    key = "c";
                    mode = "minor";
                    break;
                case "a":
                    key = "f";
                    break;
                case "b":
                    key = "g";
                    break;
                case "c" + SHARP:
                    key = "a";
                    break;
                case "d" + SHARP:
                    key = "b";
                    break;
                case "f" + SHARP:
                    key = "d";
                    break;
                case "g" + SHARP:
                    key = "e";
                    break;
                case "a" + SHARP:
                    key = "b";
                    break;
                case "d" + FLAT:
                    key = "g" + FLAT;
                    mode = "minor";
                    break;
                case "e" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
                case "g" + FLAT:
                    key = "d";
                    break;
                case "a" + FLAT:
                    key = "d" + FLAT;
                    mode = "minor";
                    break;
                case "b" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
            }
            break;
        case "lydian":
            mode = "major";
            switch (key) {
                case "c":
                    key = "g";
                    break;
                case "d":
                    key = "a";
                    break;
                case "e":
                    key = "b";
                    break;
                case "f":
                    key = "c";
                    break;
                case "g":
                    key = "d";
                    break;
                case "a":
                    key = "e";
                    break;
                case "b":
                    key = "b";
                    break;
                case "c" + SHARP:
                    key = "g" + SHARP;
                    break;
                case "d" + SHARP:
                    key = "a" + SHARP;
                    break;
                case "f" + SHARP:
                    key = "b";
                    break;
                case "g" + SHARP:
                    key = "c";
                    mode = "minor";
                    break;
                case "a" + SHARP:
                    key = "f";
                    break;
                case "d" + FLAT:
                    key = "f";
                    mode = "minor";
                    break;
                case "e" + FLAT:
                    key = "g";
                    mode = "minor";
                    break;
                case "g" + FLAT:
                    key = "d" + FLAT;
                    mode = "minor";
                    break;
                case "a" + FLAT:
                    key = "c";
                    mode = "minor";
                    break;
                case "b" + FLAT:
                    key = "d";
                    mode = "minor";
                    break;
            }
            break;
        case "mixolydian":
            mode = "major";
            switch (key) {
                case "c":
                    key = "f";
                    break;
                case "d":
                    key = "g";
                    break;
                case "e":
                    key = "a";
                    break;
                case "f":
                    key = "a" + SHARP;
                    break;
                case "g":
                    key = "c";
                    break;
                case "a":
                    key = "d";
                    break;
                case "b":
                    key = "e";
                    break;
                case "c" + SHARP:
                    key = "b";
                    break;
                case "d" + SHARP:
                    key = "g" + SHARP;
                    break;
                case "f" + SHARP:
                    key = "b";
                    break;
                case "g" + SHARP:
                    key = "b";
                    break;
                case "a" + SHARP:
                    key = "c";
                    mode = "minor";
                    break;
                case "d" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
                case "e" + FLAT:
                    key = "f";
                    mode = "minor";
                    break;
                case "g" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
                case "a" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
                case "b" + FLAT:
                    key = "c";
                    mode = "minor";
                    break;
            }
            break;
        case "locrian":
            mode = "major";
            switch (key) {
                case "c":
                    key = "b";
                    break;
                case "d":
                    key = "c";
                    mode = "minor";
                    break;
                case "e":
                    key = "f";
                    break;
                case "f":
                    key = "b";
                    break;
                case "g":
                    key = "g" + SHARP;
                    break;
                case "a":
                    key = "a" + SHARP;
                    break;
                case "b":
                    key = "c";
                    break;
                case "c" + SHARP:
                    key = "d";
                    break;
                case "d" + SHARP:
                    key = "e";
                    break;
                case "f" + SHARP:
                    key = "g";
                    break;
                case "g" + SHARP:
                    key = "a ";
                    break;
                case "a" + SHARP:
                    key = "b";
                    break;
                case "d" + FLAT:
                    key = "d";
                    break;
                case "e" + FLAT:
                    key = "d" + FLAT;
                    mode = "minor";
                    break;
                case "g" + FLAT:
                    key = "f";
                    mode = "minor";
                    break;
                case "a" + FLAT:
                    key = "g" + FLAT;
                    mode = "minor";
                    break;
                case "b" + FLAT:
                    key = "d" + FLAT;
                    mode = "minor";
                    break;
            }
            break;
        case "aeolian":
            mode = "minor";
            break;
        case "natural minor":
            mode = "minor";
            break;
        case "major":
        case "minor":
        default:
            break;
    }

    // console.debug('>> ' + key + ' ' + mode);
    return [key, mode];
};

/**
 * Get the preference for using sharp, flat, or natural based on the key signature.
 * @function
 * @param {string} keySignature - The key signature.
 * @returns {string} The preference for using sharp, flat, or natural.
 */
const getSharpFlatPreference = (keySignature) => {
    const obj = keySignatureToMode(keySignature);
    const obj2 = modeMapper(obj[0], obj[1]);
    const ks = obj2[0] + " " + obj2[1];

    if (SHARPPREFERENCE.indexOf(ks) !== -1) {
        return "sharp";
    } else if (FLATPREFERENCE.indexOf(ks) !== -1) {
        return "flat";
    } else {
        return "natural";
    }
};

/**
 * Get the custom note representation for a given note in a custom temperament.
 * @function
 * @param {string|Array} note - The note or an array representing the note and its attributes.
 * @returns {string} The custom note representation.
 */
const getCustomNote = (note) => {
    // For custom temperament note
    if (note instanceof Array) {
        note = note[0];
    }

    let centsInfo = "";
    if (note.indexOf("(") !== -1) {
        centsInfo = note.substring(note.indexOf("("), note.length);
    }

    note = note.replace(centsInfo, "");
    const articulation = getArticulation(note);
    note = note.replace(articulation, "");

    switch (articulation) {
        case "bb":
        case DOUBLEFLAT:
            note = note + "𝄫" + centsInfo;
            break;
        case "b":
        case FLAT:
            note = note + "♭" + centsInfo;
            break;
        case "##":
        case "*":
        case "x":
        case DOUBLESHARP:
            note = note + "𝄪" + centsInfo;
            break;
        case "#":
        case SHARP:
            note = note + "♯" + centsInfo;
            break;
        default:
            note = note + articulation + centsInfo;
            break;
    }
    return note;
};

/**
 * Convert a pitch, octave, and key signature to a numeric representation.
 * @function
 * @param {string} pitch - The pitch name (e.g., C, D, E).
 * @param {number} octave - The octave number.
 * @param {string} keySignature - The key signature.
 * @returns {number} The numeric representation of the pitch.
 */
const pitchToNumber = (pitch, octave, keySignature) => {
    // Calculate the pitch index based on pitch and octave.
    if (pitch.toUpperCase() === "R") {
        return 0;
    }
    // Check for flat, sharp, double flat, or double sharp.
    let transposition = 0;
    const len = pitch.length;
    let lastOne, lastTwo;
    if (len > 1) {
        if (len > 2) {
            lastTwo = pitch.slice(len - 2);
            //Unsure why slice is not working for double flats and double sharps.
            lastOne = pitch.substring(1, len);
            if (lastTwo === "bb") {
                pitch = pitch.substring(0, 1);
                transposition -= 2;
            } else if (lastOne === DOUBLEFLAT) {
                pitch = pitch.substring(0, 1);
                transposition -= 2;
            } else if (lastTwo === "*" || lastTwo === DOUBLESHARP) {
                pitch = pitch.substring(0, 1);
                transposition += 2;
            } else if (
                lastTwo === "#b" ||
                lastTwo === SHARP + FLAT ||
                lastTwo === "b#" ||
                lastTwo === FLAT + SHARP
            ) {
                // Not sure this could occur... but just in case.
                pitch = pitch.slice(0, len - 2);
            }
        }

        if (pitch.length > 1) {
            lastOne = pitch.slice(len - 1);
            if (lastOne === "b" || lastOne === FLAT) {
                pitch = pitch.slice(0, len - 1);
                transposition -= 1;
            } else if (lastOne === "#" || lastOne === SHARP) {
                pitch = pitch.slice(0, len - 1);
                transposition += 1;
            }
        }
    }

    let pitchNumber = 0;
    if (PITCHES.indexOf(pitch) !== -1) {
        pitchNumber = PITCHES.indexOf(pitch.toUpperCase());
    } else {
        // obj[1] is the solfege mapping for the current key/mode
        const obj = getScaleAndHalfSteps(keySignature);
        if (obj[1].indexOf(pitch.toLowerCase()) !== -1) {
            pitchNumber = obj[1].indexOf(pitch.toLowerCase());
        } else {
            // eslint-disable-next-line no-console
            console.debug("pitch " + pitch + " not found.");
            pitchNumber = 0;
        }
    }
    // We start at A0.
    return octave * 12 + pitchNumber - PITCHES.indexOf("A") + transposition;
};

/**
 * Convert a numeric representation to a pitch with sharps.
 * @function
 * @param {number} i - The numeric representation of the pitch.
 * @returns {Array} An array containing the pitch and octave.
 */
const numberToPitchSharp = (i) => {
    // numbertoPitch return only flats
    // This function will return sharps.
    if (i < 0) {
        let n = 0;
        while (i < 0) {
            i += 12;
            n += 1;
        }

        return [
            PITCHES2[(i + PITCHES2.indexOf("A")) % 12],
            Math.floor((i + PITCHES2.indexOf("A")) / 12) - n
        ];
    } else {
        return [
            PITCHES2[(i + PITCHES2.indexOf("A")) % 12],
            Math.floor((i + PITCHES2.indexOf("A")) / 12)
        ];
    }
};

/**
 * Convert a note and octave to a numeric representation.
 * @function
 * @param {string} notename - The note name (e.g., C, D, E, etc.).
 * @param {number} octave - The octave number.
 * @returns {number} The numeric representation of the note.
 */
const getNumber = (notename, octave) => {
    // Converts a note, e.g., C, and octave to a number
    let num;
    if (octave < 0) {
        num = 0;
    } else if (octave > 10) {
        num = 9 * 12;
    } else {
        num = 12 * (octave - 1);
    }

    notename = String(notename);
    if (notename.substring(0, 1) in NOTESTEP) {
        num += NOTESTEP[notename.substring(0, 1)];
        if (notename.length >= 1) {
            const delta = notename.substring(1);
            if (delta === "bb" || delta === DOUBLEFLAT) {
                num -= 2;
            } else if (delta === "##" || delta === "*" || delta === DOUBLESHARP) {
                num += 2;
            } else if (delta === "b" || delta === FLAT) {
                num -= 1;
            } else if (delta === "#" || delta === SHARP) {
                num += 1;
            }
        }
    }

    return num;
};

/**
 * Get the note based on a given pitch and interval in the "C major" key signature.
 * @function
 * @param {string} pitch - The pitch, including the note name and octave (e.g., "C4").
 * @param {string} interval - The interval for which the note needs to be determined (e.g., "major 3rd").
 * @returns {Array} An array containing the note and octave.
 */
const getNoteFromInterval = (pitch, interval) => {
    const len = pitch.length;
    const pitch1 = pitch.substring(0, 1);
    const note1 = pitch.substring(0, len - 1);
    const octave1 = Number(pitch.slice(-1));
    const number = pitchToNumber(note1, octave1, "C major");
    const pitches = ["C", "D", "E", "F", "G", "A", "B"];
    const priorAttrs = [DOUBLEFLAT, FLAT, "", SHARP, DOUBLESHARP];
    // let majorintervalNote;
    
    /**
     * Find the note that corresponds to a major interval.
     * @function
     * @param {string} interval - The interval for which the note needs to be determined (e.g., "major 3rd").
     * @returns {Array} An array containing the note and octave.
     */
    const findMajorInterval = (interval) => {
        //For eg. If you are asked to write a major 3rd then the
        //letters must be 3 apart.
        //Eg Ab - C or D - F. This is irrelevant of whether the first
        //note is a sharp or flat, eg G# - B.
        //Then need to work out if you need a sharp or flat on the
        //second note.
        //A Major 3rd is 4 semitones. So, Ab - C needs to be Ab - C; D
        //- F is D- F#; G# - B is G# - B#.
        //Same technique is used to code the findMajorInterval.
        const halfSteps = INTERVALVALUES[interval][0];
        // const direction = INTERVALVALUES[interval][1];
        // eslint-disable-next-line no-use-before-define
        let note = numberToPitch(number + halfSteps);
        const num = interval.split(" ");
        const pitchIndex = pitches.indexOf(pitch1);
        let index = pitchIndex + Number(num[1]) - 1;
        let octave = octave1;
        if (index > 6) {
            index = index - 7;
            octave = octave1 + 1;
        }
        const id = pitches[index];
        if (note[0].substring(0, 1) === id) {
            return [note[0], octave];
        } else if (note[0].substring(0, 1) !== id) {
            note = numberToPitchSharp(number + halfSteps);
            if (note[0] === id) {
                return [note[0], octave];
            } else {
                const steps = getNumber(id, octave) - getNumber(note1, octave1);
                const naturalIndex = priorAttrs.indexOf("");
                const attr = priorAttrs[naturalIndex + halfSteps - steps];
                note = id + attr + "";
                return [note, octave];
            }
        }
    };
    
    /**
     * Find notes for intervals other than major intervals.
     * @function
     * @param {string} interval - The interval for which the note needs to be determined.
     * @returns {Array} An array containing the note and octave.
     */
    const findOtherIntervals = (interval) => {
        const num = interval.split(" ");
        let majorNote;
        let accidental;
        let index1;

        if (
            interval === "minor 2" ||
            interval === "minor 3" ||
            interval === "minor 6" ||
            interval === "minor 7"
        ) {
            //Major intervals lowered by a half step become minor.
            majorNote = findMajorInterval("major " + num[1]);
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 0) {
                accidental = priorAttrs[index1] + FLAT;
            } else {
                accidental = priorAttrs[index1 - 1];
            }
        }

        if (
            interval === "diminished 4" ||
            interval === "diminished 5" ||
            interval === "diminished 8"
        ) {
            //Perfect intervals lowered by a half step are called diminished.
            majorNote = findMajorInterval("perfect " + num[1]);
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 0) {
                accidental = priorAttrs[index1] + FLAT;
            } else {
                accidental = priorAttrs[index1 - 1];
            }
        }

        if (
            interval === "augmented 2" ||
            interval === "augmented 3" ||
            interval === "augmented 6" ||
            interval === "augmented 7"
        ) {
            //Major intervals raised by a half step are called augmented.
            majorNote = findMajorInterval("major " + num[1]);
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 4) {
                accidental = priorAttrs[index1] + SHARP;
            } else {
                accidental = priorAttrs[index1 + 1];
            }
        }

        if (
            interval === "augmented 1" ||
            interval === "augmented 4" ||
            interval === "augmented 5" ||
            interval === "augmented 8"
        ) {
            //Perfect intervals raised by a half step are called augmented.
            majorNote = findMajorInterval("perfect " + num[1]);
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 4) {
                accidental = priorAttrs[index1] + SHARP;
            } else {
                accidental = priorAttrs[index1 + 1];
            }
        }

        return [majorNote[0].substring(0, 1) + accidental + "", majorNote[1]];
    };

    if (
        interval === "major 2" ||
        interval === "major 3" ||
        interval === "major 6" ||
        interval === "major 7" ||
        interval === "perfect 4" ||
        interval === "perfect 5" ||
        interval === "perfect 8" ||
        interval === "perfect 1"
    ) {
        return findMajorInterval(interval);
    } else {
        return findOtherIntervals(interval);
    }
};

/**
 * Convert a pitch number to a pitch name (note and octave).
 * @function
 * @param {number} i - The pitch number.
 * @param {string} [temperament="equal"] - The temperament to use (default is "equal").
 * @param {string} [startPitch="A"] - The starting pitch name (default is "A").
 * @param {number} [offset=0] - The offset value (default is 0).
 * @returns {Array} An array containing the note and octave.
 */
const numberToPitch = (i, temperament, startPitch, offset) => {
    // Calculate the pitch and octave based on index.
    // We start at A0.
    if (temperament === undefined) {
        temperament = "equal";
    }

    let n = 0;
    let pitchNumber;
    if (i < 0) {
        while (i < 0) {
            i += 12;
            n += 1; // Count octave bump ups.
        }

        if (temperament === "equal") {
            return [
                PITCHES[(i + PITCHES.indexOf("A")) % 12],
                Math.floor((i + PITCHES.indexOf("A")) / 12) - n
            ];
        } else {
            pitchNumber = Math.floor(i - offset);
        }
    } else {
        if (temperament === "equal") {
            return [
                PITCHES[(i + PITCHES.indexOf("A")) % 12],
                Math.floor((i + PITCHES.indexOf("A")) / 12)
            ];
        } else {
            pitchNumber = Math.floor(i - offset);
        }
    }

    let interval;
    if (isCustomTemperament(temperament)) {
        // The index may be outside of the octave.
        const octaveLength = TEMPERAMENT[temperament]["pitchNumber"];
        const pitchIdx = pitchNumber % octaveLength;
        const octaveFactor = Math.floor(pitchNumber / octaveLength);

        pitchNumber = pitchIdx + "";
        if (TEMPERAMENT[temperament][pitchNumber] === undefined) {
            // If custom temperament is not defined, then it will
            // store equal temperament notes.
            for (let j = 0; j < 12; j++) {
                const number = "" + j;
                interval = TEMPERAMENT["equal"]["interval"][i];
                TEMPERAMENT[temperament][number] = [
                    Math.pow(2, j / 12),
                    getNoteFromInterval(startPitch, interval)[0],
                    getNoteFromInterval(startPitch, interval)[1]
                ];
            }

            return [
                TEMPERAMENT[temperament][pitchNumber][1],
                TEMPERAMENT[temperament][pitchNumber][2]
            ];
        } else {
            // Add in octave factor from above.
            const o = Number(TEMPERAMENT[temperament][pitchNumber][2]) + octaveFactor;
            return [TEMPERAMENT[temperament][pitchNumber][1], o];
        }
    } else {
        interval = TEMPERAMENT[temperament]["interval"][pitchNumber];
        return getNoteFromInterval(startPitch, interval);
    }
};

/**
 * Get the note based on various parameters.
 * @function
 * @param {string|number} noteArg - The note name or pitch number.
 * @param {number} octave - The octave value.
 * @param {number} transposition - The transposition value.
 * @param {string} keySignature - The key signature (default is "C major").
 * @param {boolean} movable - Whether the key signature is movable (default is false).
 * @param {string} direction - The direction of the note (unused parameter).
 * @param {string} errorMsg - The error message (unused parameter).
 * @param {string} [temperament="equal"] - The temperament to use (default is "equal").
 * @returns {Array} An array containing the note and octave.
 */
function getNote(
    noteArg,
    octave,
    transposition,
    keySignature,
    movable,
    direction,
    errorMsg,
    temperament
) {
    if (temperament === undefined) {
        temperament = "equal";
    }

    let sharpFlat = false;
    let rememberFlat = false;
    let rememberSharp = false;

    if (transposition === undefined) {
        transposition = 0;
    }

    transposition = Math.round(transposition);

    if (typeof noteArg !== "number") {
        // Could be mi#<sub>4</sub> (from matrix) or mi# (from note).
        if (noteArg.substr(-1) === ">") {
            // Read octave and solfege from HTML
            octave = parseInt(noteArg.slice(noteArg.indexOf(">") + 1, noteArg.indexOf("/") - 1));
            noteArg = noteArg.substr(0, noteArg.indexOf("<"));
        }
        if (
            noteArg.toLowerCase().substr(0, 4) === "rest" ||
            noteArg.toLowerCase().substr(0, 4) === "r"
        ) {
            return ["R", ""];
        }
        // Could be a number as a string (with or without an accidental.
        let noteAsNumber = noteArg;
        if (["#", SHARP, FLAT, "b"].indexOf(noteArg.substr(-1)) !== -1) {
            noteAsNumber = noteArg.slice(0, noteArg.length - 1);
        }
        if (!isNaN(noteAsNumber)) {
            if (["#", SHARP].indexOf(noteArg.substr(-1)) !== -1) {
                transposition += 1;
            } else if (["b", FLAT].indexOf(noteArg.substr(-1)) !== -1) {
                transposition -= 1;
            }
            noteArg = Number(noteAsNumber);
        }
    }

    octave = Math.round(octave);

    if (typeof noteArg === "number") {
        // Assume it is a pitch number.
        if (!keySignature) {
            keySignature = "C major";
        }
        let kOffset = 0;
        if (movable) {
            kOffset = PITCHES.indexOf(keySignature.split(" ")[0]);
            if (kOffset === -1) {
                kOffset = PITCHES.indexOf(keySignature.split(" ")[0]);
            }
            if (kOffset === -1) {
                kOffset = PITCHES2.indexOf(keySignature.split(" ")[0]);
            }
            if (kOffset === -1) {
                kOffset = 0;
                // eslint-disable-next-line no-console
                console.log(
                    "Cannot find " +
                    keySignature.split(" ")[0] +
                    ". Reverting to C"
                );
            }
        }
        if (getSharpFlatPreference(keySignature) === "sharp") {
            noteArg = PITCHES2[(noteArg + kOffset) % 12];
        } else {
            noteArg = PITCHES[(noteArg + kOffset) % 12];
        }
    }

    let note;
    let articulation;

    if (temperament === "equal") {
        // Check for double flat or double sharp. Since bb and x behave
        // funny with string operations, we jump through some hoops.
        articulation = getArticulation(noteArg);
        noteArg = noteArg.replace(articulation, "");

        switch (articulation) {
            case "bb":
            case DOUBLEFLAT:
                noteArg += "b";
                rememberFlat = true;
                transposition -= 1;
                break;
            case "b":
            case FLAT:
                noteArg += "b";
                rememberFlat = true;
                break;
            case "##":
            case "*":
            case "x":
            case DOUBLESHARP:
                noteArg += "#";
                rememberSharp = true;
                transposition += 1;
                break;
            case "#":
            case SHARP:
                noteArg += "#";
                rememberSharp = true;
                break;
            case "b#":
            case "#b":
            case FLAT + SHARP:
            case SHARP + FLAT:
            default:
                break;
        }

        // Already a note? No need to convert from solfege.
        if (rememberSharp) {
            if (noteArg in STOSHARP) {
                noteArg = STOSHARP[noteArg];
            }
        } else if (noteArg in BTOFLAT) {
            noteArg = BTOFLAT[noteArg];
        } else if (noteArg in STOSHARP) {
            noteArg = STOSHARP[noteArg];
        }

        if (noteArg in EXTRATRANSPOSITIONS) {
            octave += EXTRATRANSPOSITIONS[noteArg][1];
            note = EXTRATRANSPOSITIONS[noteArg][0];
        } else if (NOTESSHARP.indexOf(noteArg.toUpperCase()) !== -1) {
            note = noteArg.toUpperCase();
        } else if (NOTESFLAT.indexOf(noteArg) !== -1) {
            note = noteArg;
        } else if (NOTESFLAT2.indexOf(noteArg) !== -1) {
            // Convert to uppercase, e.g., d♭ -> D♭.
            note = NOTESFLAT[NOTESFLAT2.indexOf(noteArg)];
        } else {
            if (["#", SHARP, FLAT, "b"].indexOf(noteArg.substr(-1)) !== -1) {
                sharpFlat = true;
            }

            if (!keySignature) {
                keySignature = "C major";
            }

            let obj;

            if (movable) {
                obj = getScaleAndHalfSteps(keySignature);
            } else {
                obj = getScaleAndHalfSteps("C major");
            }

            let thisScale = obj[0];
            const halfSteps = obj[1];
            const myKeySignature = obj[2];
            const mode = obj[3];
            let offset;
            if (movable) {
                // Ensure it is a valid key signature.
                offset = thisScale.indexOf(myKeySignature);
                if (offset === -1) {
                    // eslint-disable-next-line no-console
                    console.debug(
                        "WARNING: Key " +
                            myKeySignature +
                            " not found in " +
                            thisScale +
                            ". Using default of C"
                    );
                    offset = 0;
                    thisScale = NOTESSHARP;
                }

                // We need to set the octave relative to the tonic.
                // Starting from C_4 (note_octave)
                // All keys C# -- F# would remain in octave four
                // All keys Gb -- B would be in octave three (since
                // going down is closer than going up)
                if (offset > 5) {
                    transposition -= 12; // go down one octave
                }
            } else {
                offset = 0;
            }

            if (sharpFlat) {
                if (noteArg.substr(-1) === "#") {
                    offset += 1;
                } else if (noteArg.substr(-1) === SHARP) {
                    offset += 1;
                } else if (noteArg.substr(-1) === FLAT) {
                    offset -= 1;
                } else if (noteArg.substr(-1) === "b") {
                    offset -= 1;
                }
            }

            let solfegePart;
            if (halfSteps.indexOf(noteArg.substr(0, 1).toLowerCase()) !== -1) {
                solfegePart = noteArg.substr(0, 1).toLowerCase();
            } else if (halfSteps.indexOf(noteArg.substr(0, 2).toLowerCase()) !== -1) {
                solfegePart = noteArg.substr(0, 2).toLowerCase();
            } else if (halfSteps.indexOf(noteArg.substr(0, 3).toLowerCase()) !== -1) {
                solfegePart = noteArg.substr(0, 3).toLowerCase();
            } else {
                // The note should already be translated, but just in case...
                // Reverse any i18n
                // solfnotes_ is used in the interface for i18n
                //.TRANS: the note names must be separated by single spaces
                const solfnotes_ = _("ti la sol fa mi re do").split(" ");
                if (solfnotes_.indexOf(noteArg.substr(0, 1).toLowerCase()) !== -1) {
                    solfegePart = SOLFNOTES[solfnotes_.indexOf(noteArg.substr(0, 2).toLowerCase())];
                } else if (solfnotes_.indexOf(noteArg.substr(0, 2).toLowerCase()) !== -1) {
                    solfegePart = SOLFNOTES[solfnotes_.indexOf(noteArg.substr(0, 2).toLowerCase())];
                } else if (solfnotes_.indexOf(noteArg.substr(0, 3).toLowerCase()) !== -1) {
                    solfegePart = SOLFNOTES[solfnotes_.indexOf(noteArg.substr(0, 3).toLowerCase())];
                } else {
                    solfegePart = noteArg.substr(0, 2).toLowerCase();
                }
            }

            if (movable) {
                let i;
                switch (mode) {
                    case "dorian":
                        i = SOLFEGENAMES.indexOf(solfegePart);
                        if (i > 0) {
                            transposition += 12;
                        }

                        transposition -= 12;
                        i += 6;
                        if (i > 6) {
                            i -= 7;
                        }

                        solfegePart = SOLFEGENAMES[i];
                        break;
                    case "phrygian":
                        i = SOLFEGENAMES.indexOf(solfegePart);
                        if (i > 1) {
                            transposition += 12;
                        }

                        i += 5;
                        if (i > 6) {
                            i -= 7;
                        }

                        solfegePart = SOLFEGENAMES[i];
                        break;
                    case "lydian":
                        i = SOLFEGENAMES.indexOf(solfegePart);
                        if (i > 2) {
                            transposition += 12;
                        }

                        i += 4;
                        if (i > 6) {
                            i -= 7;
                        }

                        solfegePart = SOLFEGENAMES[i];
                        break;
                    case "mixolydian":
                        i = SOLFEGENAMES.indexOf(solfegePart);
                        if (i > 3) {
                            transposition += 12;
                        }

                        i += 3;
                        if (i > 6) {
                            i -= 7;
                        }

                        solfegePart = SOLFEGENAMES[i];
                        break;
                    case "minor":
                    case "aeolian":
                        i = SOLFEGENAMES.indexOf(solfegePart);
                        if (i > 4) {
                            transposition += 12;
                        }

                        i += 2;
                        if (i > 6) {
                            i -= 7;
                        }

                        solfegePart = SOLFEGENAMES[i];
                        break;
                    case "locrian":
                        i = SOLFEGENAMES.indexOf(solfegePart);
                        if (i > 5) {
                            transposition += 12;
                        }

                        i += 1;
                        if (i > 6) {
                            i -= 7;
                        }

                        solfegePart = SOLFEGENAMES[i];
                        break;
                    case "major":
                    case "ionian":
                    default:
                        break;
                }
            }

            let index;
            if (halfSteps.indexOf(solfegePart) !== -1) {
                index = halfSteps.indexOf(solfegePart) + offset;
                if (index > 11) {
                    index -= 12;
                    octave += 1;
                } else if (index < 0) {
                    index += 12;
                    octave -= 1;
                }

                note = thisScale[index];
            } else {
                // eslint-disable-next-line no-console
                console.debug(
                    "WARNING: Note [" + noteArg + "] not found in " + halfSteps + ". Returning REST"
                );
                if (errorMsg != undefined) {
                    errorMsg(INVALIDPITCH, null);
                }

                return ["R", ""];
            }

            if (note in EXTRATRANSPOSITIONS) {
                octave += EXTRATRANSPOSITIONS[note][1];
                note = EXTRATRANSPOSITIONS[note][0];
            }
        }

        if (transposition && transposition !== 0) {
            let deltaOctave, deltaNote;
            if (transposition < 0) {
                deltaOctave = -Math.floor(-transposition / 12);
                deltaNote = -(-transposition % 12);
            } else {
                deltaOctave = Math.floor(transposition / 12);
                deltaNote = transposition % 12;
            }

            octave += deltaOctave;

            if (deltaNote > 0) {
                if (NOTESSHARP.indexOf(note) !== -1) {
                    let i = NOTESSHARP.indexOf(note);
                    i += deltaNote;
                    if (i < 0) {
                        i += 12;
                        octave -= 1;
                    } else if (i > 11) {
                        i -= 12;
                        octave += 1;
                    }

                    note = NOTESSHARP[i];
                } else if (NOTESFLAT.indexOf(note) !== -1) {
                    let i = NOTESFLAT.indexOf(note);
                    i += deltaNote;
                    if (i < 0) {
                        i += 12;
                        octave -= 1;
                    } else if (i > 11) {
                        i -= 12;
                        octave += 1;
                    }

                    note = NOTESFLAT[i];
                } else {
                    // eslint-disable-next-line no-console
                    console.debug("note not found? " + note);
                }
            } else if (deltaNote < 0) {
                if (NOTESFLAT.indexOf(note) !== -1) {
                    let i = NOTESFLAT.indexOf(note);
                    i += deltaNote;
                    if (i < 0) {
                        i += 12;
                        octave -= 1;
                    } else if (i > 11) {
                        i -= 12;
                        octave += 1;
                    }

                    note = NOTESFLAT[i];
                } else if (NOTESSHARP.indexOf(note) !== -1) {
                    let i = NOTESSHARP.indexOf(note);
                    i += deltaNote;
                    if (i < 0) {
                        i += 12;
                        octave -= 1;
                    } else if (i > 11) {
                        i -= 12;
                        octave += 1;
                    }

                    note = NOTESSHARP[i];
                } else {
                    // eslint-disable-next-line no-console
                    console.debug("note not found? " + note);
                }
            }
        }

        // Try to find a note in the current keySignature
        switch (getSharpFlatPreference(keySignature)) {
            case "flat":
                if (note in EQUIVALENTFLATS) {
                    note = EQUIVALENTFLATS[note];
                }
                break;
            case "sharp":
                if (note in EQUIVALENTSHARPS) {
                    note = EQUIVALENTSHARPS[note];
                }
                break;
            case "natural":
                if (note in EQUIVALENTNATURALS) {
                    note = EQUIVALENTNATURALS[note];
                }
                break;
            default:
                break;
        }

        // Consider the note direction (in the case of intervals)
        if (direction != undefined) {
            switch (direction) {
                case -1:
                    if (note in EQUIVALENTFLATS) {
                        note = EQUIVALENTFLATS[note];
                    }
                    break;
                case 1:
                    if (note in EQUIVALENTSHARPS) {
                        note = EQUIVALENTSHARPS[note];
                    }
                    break;
                default:
                    break;
            }
        }

        if (rememberSharp) {
            if (note in EQUIVALENTSHARPS) {
                note = EQUIVALENTSHARPS[note];
            }
        } else if (rememberFlat) {
            if (note in EQUIVALENTFLATS) {
                note = EQUIVALENTFLATS[note];
            }
        }
    } else if (isCustomTemperament(temperament)) {
        note = getCustomNote(noteArg);
        let pitchNumber = null;
        for (const number in TEMPERAMENT[temperament]) {
            if (number !== "pitchNumber" && number != "interval") {
                if (note === TEMPERAMENT[temperament][number][3]) {
                    if (typeof number === "string") {
                        pitchNumber = Number(number);
                    } else {
                        pitchNumber = number;
                    }
                    break;
                } else if (note === TEMPERAMENT[temperament][number][1]) {
                    if (typeof number === "string") {
                        pitchNumber = Number(number);
                    } else {
                        pitchNumber = number;
                    }
                    break;
                }
            }
        }

        if (pitchNumber === null || pitchNumber === "null") {
            return getNote(
                noteArg,
                octave,
                transposition,
                keySignature,
                movable,
                direction,
                errorMsg
                // No temperament arg is passed so the note will not
                // be processed as a custom temperament.
            );
        }

        let inOctave = octave;
        const octaveLength = TEMPERAMENT[temperament]["pitchNumber"];
        let deltaOctave, deltaNote;
        if (transposition !== 0) {
            if (transposition < 0) {
                deltaOctave = -Math.floor(-transposition / octaveLength);
                deltaNote = -(-transposition % octaveLength);
            } else {
                deltaOctave = Math.floor(transposition / octaveLength);
                deltaNote = transposition % octaveLength;
            }

            inOctave += deltaOctave;
            pitchNumber += deltaNote;
        }

        if (pitchNumber < 0) {
            pitchNumber = pitchNumber + octaveLength;
            inOctave = inOctave - 1;
        } else if (pitchNumber >= octaveLength) {
            pitchNumber = pitchNumber - octaveLength;
            inOctave = inOctave + 1;
        }
        pitchNumber = pitchNumber + "";
        if (TEMPERAMENT[temperament][pitchNumber].length > 3) {
            note = TEMPERAMENT[temperament][pitchNumber][3];
        } else {
            note = TEMPERAMENT[temperament][pitchNumber][1];
        }
        octave = inOctave;
    } else {
        // Return E# as E#, Fb as Fb etc. for different temperament systems.
        articulation = getArticulation(noteArg);
        noteArg = noteArg.replace(articulation, "");

        if (SOLFEGENAMES.indexOf(noteArg) !== -1) {
            noteArg = FIXEDSOLFEGE[noteArg];
        }

        switch (articulation) {
            case "bb":
            case DOUBLEFLAT:
                noteArg += "𝄫";
                break;
            case "b":
            case FLAT:
                noteArg += "b";
                break;
            case "##":
            case "*":
            case "x":
            case DOUBLESHARP:
                noteArg += "𝄪";
                break;
            case "#":
            case SHARP:
                noteArg += "#";
                break;
            case "b#":
            case "#b":
            case FLAT + SHARP:
            case SHARP + FLAT:
            default:
                break;
        }

        note = noteArg;

        let deltaOctave, deltaNote;
        if (transposition && transposition !== 0) {
            if (transposition < 0) {
                deltaOctave = -Math.floor(-transposition / 12);
                deltaNote = -(-transposition % 12);
            } else {
                deltaOctave = Math.floor(transposition / 12);
                deltaNote = transposition % 12;
            }

            octave += deltaOctave;

            let pitch, note1, octave1;
            if (deltaNote > 0) {
                pitch = note + "" + octave;
                for (const interval in INTERVALVALUES) {
                    if (deltaNote === INTERVALVALUES[interval][0]) {
                        note1 = getNoteFromInterval(pitch, interval);
                        break;
                    }
                }
            } else if (deltaNote < 0) {
                octave1 = octave - 1;
                pitch = note + "" + octave1;
                for (const interval in INTERVALVALUES) {
                    if (12 + deltaNote === INTERVALVALUES[interval][0]) {
                        note1 = getNoteFromInterval(pitch, interval);
                        break;
                    }
                }
            } else if (deltaNote === 0) {
                pitch = note + "" + octave;
                note1 = getNoteFromInterval(pitch, "perfect 1");
            }
            note = note1[0];
            octave = note1[1];
        }
    }

    if (octave < 1) {
        return [note, 1];
    } else if (octave > 10) {
        return [note, 10];
    } else {
        return [note, octave];
    }
}

/**
 * Calculate the pitch number based on the activity, pitch value, and tur parameters.
 * @function
 * @param {Object} activity - The activity object.
 * @param {string|number} np - The pitch value (note name or frequency in Hertz).
 * @param {Object} tur - The tur parameters containing singer information.
 * @returns {number} The calculated pitch number.
 */
const _calculate_pitch_number = (activity, np, tur) => {
    let obj;
    if (tur.singer.lastNotePlayed !== null) {
        if (typeof np === "string") {
            obj = noteToObj(np);
        } else {
            // Hertz
            obj = frequencyToPitch(np);
        }
    } else if (
        tur.singer.inNoteBlock in tur.singer.notePitches &&
        tur.singer.notePitches[last(tur.singer.inNoteBlock)].length > 0
    ) {
        obj = getNote(
            tur.singer.notePitches[last(tur.singer.inNoteBlock)][0],
            tur.singer.noteOctaves[last(tur.singer.inNoteBlock)][0],
            0,
            tur.singer.keySignature,
            tur.singer.movable,
            null,
            activity.errorMsg
        );
    } else {
        try {
            if (typeof np === "string") {
                obj = noteToObj(np);
            } else {
                // Hertz
                obj = frequencyToPitch(np);
            }
        } catch (e) {
            activity.errorMsg(INVALIDPITCH);
            obj = ["G", 4];
        }
    }
    return pitchToNumber(obj[0], obj[1], tur.singer.keySignature) - tur.singer.pitchNumberOffset;
};

/**
 * Build the scale based on the given key signature.
 * @function
 * @param {string} keySignature - The key signature.
 * @returns {Array} An array containing the scale and the corresponding intervals.
 */
const buildScale = (keySignature) => {
    // FIX ME: temporary hard-coded fix to avoid errors in pitch preview
    if (keySignature == "C♭ major") {
        const scale = ["C" + FLAT, "D" + FLAT, "E" + FLAT, "F" + FLAT, "G" + FLAT, "A" + FLAT, "B" + FLAT, "C" + FLAT];
        return [scale, [2, 2, 1, 2, 2, 2, 1]];
    } else if (keySignature == "F♭ major") {
        const scale = ["F" + FLAT, "G" + FLAT, "A" + FLAT, "B" + DOUBLEFLAT, "C" + FLAT, "D" + FLAT, "E" + FLAT, "F" + FLAT];
        return [scale, [2, 2, 1, 2, 2, 2, 1]];
    }

    let obj = keySignatureToMode(keySignature);
    let myKeySignature = obj[0];
    if (myKeySignature == "C" + FLAT) {
        obj = keySignatureToMode("B " + obj[1]);
        myKeySignature = obj[0];
    }

    let halfSteps;
    if (obj[1] === "CUSTOM") {
        halfSteps = customMode;
    } else {
        halfSteps = MUSICALMODES[obj[1]];
    }

    let thisScale;
    if (NOTESFLAT.indexOf(myKeySignature) !== -1) {
        if (SHARPPREFERENCE.indexOf(obj[0].toLowerCase() + " " + obj[1]) !== -1) {
            thisScale = NOTESSHARP;
        } else {
            thisScale = NOTESFLAT;
        }
    } else {
        if (FLATPREFERENCE.indexOf(obj[0].toLowerCase() + " " + obj[1]) !== -1) {
            thisScale = NOTESFLAT;
        } else {
            thisScale = NOTESSHARP;
        }
    }

    let idx = thisScale.indexOf(myKeySignature);
    if (idx === -1) {
        idx = 0;
    }

    const scale = [myKeySignature];
    let ii = idx;
    for (let i = 0; i < halfSteps.length; i++) {
        ii += halfSteps[i];
        scale.push(thisScale[ii % SEMITONES]);
    }

    // Make sure there are no repeated letter names for seven step scales
    if (scale.length < 9) {
        for (let i = 0; i < scale.length - 1; i++) {
            if (i === 0) {
                if (scale[i][0] === scale[i + 1][0]) {
                    if (scale[i + 1] in CONVERT_UP) {
                        scale[i + 1] = CONVERT_UP[scale[i + 1]];
                    }
                }
            } else {
                // Do we go up or down?
                if (thisScale === NOTESSHARP) {
                    if (scale[i][0] === scale[i + 1][0]) {
                        // We need to go down.
                        if (scale[i] in CONVERT_DOWN) {
                            scale[i] = CONVERT_DOWN[scale[i]];
                        }
                    }
                } else {
                    if (scale[i - 1][0] === scale[i][0]) {
                        // We need to go up.
                        if (scale[i] in CONVERT_UP) {
                            scale[i] = CONVERT_UP[scale[i]];
                        }
                    }
                }
            }
        }
        // Final check -- we may need to use double sharps or double flats.
        if (myKeySignature.length === 2 && myKeySignature[1] === SHARP) {
            for (let i = scale.length - 1; i > 0; i--) {
                if (scale[i][0] === scale[i - 1][0]) {
                    if (scale[i - 1] in CONVERT_DOWN) {
                        scale[i - 1] = CONVERT_DOWN[scale[i - 1]];
                    } else if (scale[i - 1] in CONVERT_DOUBLE_DOWN) {
                        scale[i - 1] = CONVERT_DOUBLE_DOWN[scale[i - 1]];
                    }
                }
            }
        } else if (myKeySignature.length === 2 && myKeySignature[1] === FLAT) {
            for (let i = 0; i < scale.length - 2; i++) {
                if (scale[i][0] === scale[i + 1][0]) {
                    if (scale[i + 1] in CONVERT_UP) {
                        scale[i + 1] = CONVERT_UP[scale[i + 1]];
                    } else if (scale[i + 1] in CONVERT_DOUBLE_UP) {
                        scale[i + 1] = CONVERT_DOUBLE_UP[scale[i + 1]];
                    }
                }
            }
        }
    }
 
    return [scale, halfSteps];
};

/**
 * Get the step size (number of half-steps) to the next note in the given key signature.
 * @function
 * @param {string} keySignature - The key signature.
 * @param {string} pitch - The pitch (note name).
 * @param {string} direction - The direction of the step ("up" or "down").
 * @param {number} transposition - The transposition value.
 * @param {string} temperament - The temperament used for pitch calculation.
 * @returns {number} The step size in half-steps.
 */
const _getStepSize = (keySignature, pitch, direction, transposition, temperament) => {
    // Returns how many half-steps to the next note in this key.
    if (temperament === undefined) {
        temperament = "equal";
    }
    if (isCustomTemperament(temperament)) {
        //Scalar = Semitone for custom Temperament.
        return transposition;
    }

    let thisPitch = pitch;
    const obj = buildScale(keySignature);
    const scale = obj[0];
    const halfSteps = obj[1];

    if (thisPitch in BTOFLAT) {
        thisPitch = BTOFLAT[thisPitch];
    } else if (thisPitch in STOSHARP) {
        thisPitch = STOSHARP[thisPitch];
    }
    
    /**
     * Check if two pitches are logically equivalent.
     * @function
     * @param {string} s1 - The first pitch.
     * @param {string} s2 - The second pitch.
     * @returns {boolean} True if the pitches are logically equivalent, otherwise false.
     */
    const logicalEquals = (s1, s2) => {
        if (s1 == s2) {
            return true;
        } else if (s1 == "E" + SHARP && s2 == "F") {
            return true;
        } else if (s1 == "E" && s2 == "F" + FLAT) {
            return true;
        } else if (s1 == "F" && s2 == "E♯") {
            return true;
        } else if (s1 == "F" + FLAT && s2 == "E") {
            return true;
        } else if (s1 == "B" + SHARP && s2 == "C") {
            return true;
        } else if (s1 == "B" && s2 == "C" + FLAT) {
            return true;
        } else if (s1 == "C" && s2 == "B♯") {
            return true;
        } else if (s1 == "C" + FLAT && s2 == "B") {
            return true;
        } else if (s1 == "B" + DOUBLEFLAT && s2 == "A") {
            return true;
        } else if (s1 == "F" + DOUBLESHARP && s2 == "G") {
            return true;
        }
        return false;
    };

    let ii = scale.findIndex((scale) => logicalEquals(scale, pitch));
    if (ii !== -1) {
        if (direction === "up") {
            return halfSteps[ii];
        } else {
            if (ii > 0) {
                return -halfSteps[ii - 1];
            } else {
                return -last(halfSteps);
            }
        }
    }

    if (ii === -1) {
        if (thisPitch in EQUIVALENTFLATS) {
            ii = scale.indexOf(EQUIVALENTFLATS[thisPitch]);
        }
    }

    if (ii === -1) {
        if (thisPitch in EQUIVALENTSHARPS) {
            ii = scale.indexOf(EQUIVALENTSHARPS[thisPitch]);
        }
    }

    if (ii === -1) {
        if (thisPitch in EQUIVALENTNATURALS) {
            ii = scale.indexOf(EQUIVALENTNATURALS[thisPitch]);
        }
    }

    if (ii !== -1) {
        if (direction === "up") {
            return halfSteps[ii];
        } else {
            if (ii > 0) {
                return -halfSteps[ii - 1];
            } else {
                return -last(halfSteps);
            }
        }
    }

    // Pitch is not in the consonant scale of this key, so we need to
    // shift up or down to the next note in the key.
    let offset = 0;
    let i = PITCHES.indexOf(thisPitch);
    if (i !== -1) {
        while (scale.indexOf(thisPitch) === -1) {
            i = PITCHES.indexOf(thisPitch);
            if (i === -1) {
                i = PITCHES2.indexOf(thisPitch);
            }

            if (direction === "up") {
                i += 1;
                thisPitch = PITCHES[i % 12];
                offset += 1;
            } else {
                i -= 1;
                if (i < 0) {
                    i += 12;
                }

                thisPitch = PITCHES[i];
                offset -= 1;
            }
        }

        return offset;
    }

    i = PITCHES2.indexOf(thisPitch);
    if (i !== -1) {
        while (scale.indexOf(thisPitch) === -1) {
            i = PITCHES2.indexOf(thisPitch);
            if (i === -1) {
                i = PITCHES.indexOf(thisPitch);
            }

            if (direction === "up") {
                i += 1;
                thisPitch = PITCHES2[i % 12];
                offset += 1;
            } else {
                i -= 1;
                if (i < 0) {
                    i += 12;
                }

                thisPitch = PITCHES2[i];
                offset -= 1;
            }
        }

        return offset;
    }

    // Should never get here, but just in case.
    // eslint-disable-next-line no-console
    console.debug(thisPitch + " not found");
    return 0;
};

/**
 * Get the step size (number of half-steps) to the next note in the upward direction.
 * @function
 * @param {string} keySignature - The key signature.
 * @param {string} pitch - The pitch (note name).
 * @param {number} transposition - The transposition value.
 * @param {string} temperament - The temperament used for pitch calculation.
 * @returns {number} The step size in half-steps.
 */
const getStepSizeUp = (keySignature, pitch, transposition, temperament) => {
    return _getStepSize(keySignature, pitch, "up", transposition, temperament);
};

/**
 * Get the step size (number of half-steps) to the next note in the downward direction.
 * @function
 * @param {string} keySignature - The key signature.
 * @param {string} pitch - The pitch (note name).
 * @param {number} transposition - The transposition value.
 * @param {string} temperament - The temperament used for pitch calculation.
 * @returns {number} The step size in half-steps.
 */
const getStepSizeDown = (keySignature, pitch, transposition, temperament) => {
    return _getStepSize(keySignature, pitch, "down", transposition, temperament);
};


/**
 * Get the length of the mode (number of notes) for the given key signature.
 * @function
 * @param {string} keySignature - The key signature.
 * @returns {number} The length of the mode.
 */
const getModeLength = keySignature => { return buildScale(keySignature)[1].length; };

/**
 * Map scale degree to pitch or vice versa for a chosen mode.
 * @function
 * @param {string} keySignature - The key signature.
 * @param {number} scaleDegree - The scale degree.
 * @param {boolean} movable - Indicates if movable do is present.
 * @param {string} pitch - The pitch (note name).
 * @returns {string|Array} The pitch corresponding to the scale degree or vice versa.
 */
const scaleDegreeToPitchMapping = (keySignature, scaleDegree, movable, pitch) => {
    if (pitch === null) {
        scaleDegree -= 1;
    }
    // Subtract one to make it zero-based as we're working with arrays

    // Info variables according to chosen mode
    const chosenMode = keySignatureToMode(keySignature);
    const obj1 = buildScale(keySignature);
    const chosenModeScale = obj1[0];
    const chosenModePattern = obj1[1];

    // Pitch numbers of the chosen mode
    const semitones = [0];

    // Scale degrees defined for chosen mode;
    // Rest would require arbitration
    const definedScaleDegree = [];

    // Final 7 note scale combining chosen mode and arbitration
    let finalScale = [];
    const sd = [];

    // if movable do is present just return the major/perfect tones
    if (movable) {
        finalScale = buildScale(chosenMode[0] + " major")[0];

        if (pitch === null) {
            return finalScale[scaleDegree];
        }
        if (scaleDegree == null) {
            for (const i in finalScale) {
                if (finalScale[i][0] == pitch[0]) {
                    sd.push(String(Number(i) + 1));
                    if (finalScale[i] == pitch) {
                        sd.push(NATURAL);
                    } else {
                        if (finalScale[i].includes(SHARP)) {
                            sd.push(FLAT);
                        } else if (finalScale[i].includes(FLAT)) {
                            sd.push(FLAT);
                        } else if (pitch.includes(SHARP)) {
                            sd.push(SHARP);
                        } else if (pitch.includes(FLAT)) {
                            sd.push(FLAT);
                        }
                    }
                }
            }
            return sd;
        }
    } else {
        // For 7 note systems scale degrees have a one-one relation
        if (chosenModePattern.length == 7) {
            if (pitch === null) {
                return chosenModeScale[scaleDegree];
            }
            if (scaleDegree == null) {
                for (const i in chosenModeScale) {
                    if (chosenModeScale[i][0] == pitch[0]) {
                        sd.push(String(Number(i) + 1));
                        if (chosenModeScale[i] == pitch) {
                            sd.push(NATURAL);
                        } else {
                            if (chosenModeScale[i].includes(SHARP)) {
                                sd.push(FLAT);
                            } else if (chosenModeScale[i].includes(FLAT)) {
                                sd.push(FLAT);
                            } else if (pitch.includes(SHARP)) {
                                sd.push(SHARP);
                            } else if (pitch.includes(FLAT)) {
                                sd.push(FLAT);
                            }
                        }
                    }
                }
                return sd;
            }
        } else if (chosenModePattern.length < 7) {
            // Major scale of the choosen key is used as fallback
            const majorScale = buildScale(chosenMode[0] + " major")[0];

            // according to the choosenModePattern, calculate defined scale degrees
            for (let i = 0; i < chosenModePattern.length; i++) {
                switch (semitones[i]) {
                    case 0:
                        definedScaleDegree.push(1);
                        break;
                    case 1:
                    case 2:
                        definedScaleDegree.push(2);
                        break;
                    case 3:
                    case 4:
                        definedScaleDegree.push(3);
                        break;
                    case 5:
                        definedScaleDegree.push(4);
                        break;
                    case 6:
                        if (definedScaleDegree[definedScaleDegree.length - 1] !== 4) {
                            definedScaleDegree.push(4);
                        } else if (semitones[i] + chosenModeScale[i] != 7) {
                            definedScaleDegree.push(5);
                        }
                        break;
                    case 7:
                        definedScaleDegree.push(5);
                        break;
                    case 8:
                    case 9:
                        definedScaleDegree.push(6);
                        break;
                    case 10:
                    case 11:
                        definedScaleDegree.push(7);
                        break;
                    default:
                        continue;
                }

                semitones.push(semitones[i] + chosenModePattern[i]);
            }

            // For scale degrees which are defined --> Use choosen Mode's notes
            // For scale degrees which are undefined --> Use fallback notes
            let k = 0;
            for (let i = 0; i < 7; i++) {
                if (definedScaleDegree.indexOf(i + 1) !== -1) {
                    finalScale.push(chosenModeScale[k]);
                    k++;
                } else {
                    finalScale.push(majorScale[i]);
                }
            }

            if (pitch === null) {
                return finalScale[scaleDegree];
            }
            if (scaleDegree == null) {
                for (const i in finalScale) {
                    if (finalScale[i][0] == pitch[0]) {
                        sd.push(String(Number(i) + 1));
                        if (finalScale[i] == pitch) {
                            sd.push(NATURAL);
                        } else {
                            if (finalScale[i].includes(SHARP)) {
                                sd.push(FLAT);
                            } else if (finalScale[i].includes(FLAT)) {
                                sd.push(FLAT);
                            } else if (pitch.includes(SHARP)) {
                                sd.push(SHARP);
                            } else if (pitch.includes(FLAT)) {
                                sd.push(FLAT);
                            }
                        }
                    }
                }
                return sd;
            }
        } else {
            // For scales with greater than 7 notes
            // All scales degrees are defined, just prefer the perfect/major ones

            for (let i = 0; i < chosenModePattern.length; i++) {
                semitones.push(semitones[i] + chosenModePattern[i]);
            }

            for (let i = 0; i < semitones.length; i++) {
                switch (semitones[i]) {
                    case 0:
                        finalScale.push(chosenModeScale[i]);
                        break;
                    case 1:
                        if (semitones[i + 1] == 2) {
                            finalScale.push(chosenModeScale[i + 1]);
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 2:
                        if (semitones[i - 1] == 1) {
                            continue;
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 3:
                        if (semitones[i + 1] == 4) {
                            finalScale.push(chosenModeScale[i + 1]);
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 4:
                        if (semitones[i - 1] == 3) {
                            continue;
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 5:
                        finalScale.push(chosenModeScale[i]);
                        break;
                    case 6:
                        if (
                            (semitones[i - 1] == 5 && semitones[i + 1] != 7) ||
                            (semitones[i - 1] != 5 && semitones[i + 1] == 7)
                        ) {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 7:
                        finalScale.push(chosenModeScale[i]);
                        break;
                    case 8:
                        if (semitones[i + 1] == 9) {
                            finalScale.push(chosenModeScale[i + 1]);
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 9:
                        if (semitones[i - 1] == 8) {
                            continue;
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 10:
                        if (semitones[i + 1] == 11) {
                            finalScale.push(chosenModeScale[i + 1]);
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 11:
                        if (semitones[i - 1] == 10) {
                            continue;
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    default:
                        // console.debug("No case for " + semitones[i]);
                        break;
                }
            }

            if (pitch === null) {
                return finalScale[scaleDegree];
            }
            if (scaleDegree == null) {
                for (const i in finalScale) {
                    if (finalScale[i][0] == pitch[0]) {
                        sd.push(String(Number(i) + 1));
                        if (finalScale[i] == pitch) {
                            sd.push(NATURAL);
                        } else {
                            if (finalScale[i].includes(SHARP)) {
                                sd.push(FLAT);
                            } else if (finalScale[i].includes(FLAT)) {
                                sd.push(FLAT);
                            } else if (pitch.includes(SHARP)) {
                                sd.push(SHARP);
                            } else if (pitch.includes(FLAT)) {
                                sd.push(FLAT);
                            }
                        }
                    }
                }
                return sd;
            }
        }
    }
};

/**
 * Get the note corresponding to the nth scale degree in the given key signature.
 * Used for movable solfege.
 * @function
 * @param {string} keySignature - The key signature.
 * @param {number} scaleDegree - The scale degree.
 * @returns {string} The note corresponding to the scale degree in the current key signature.
 */
const nthDegreeToPitch = (keySignature, scaleDegree) => {
    // Returns note corresponding to scale degree in current key
    // signature. Used for movable solfege.
    const scale = buildScale(keySignature)[0];
    // Scale degree is specified as do === 1, re === 2, etc., so we need
    // to subtract 1 to make it zero-based.
    // scaleDegree -= 1;

    // We mod to ensure we don't run out of notes.
    // FixMe: bump octave if we wrap.

    scaleDegree %= scale.length - 1;
    return scale[scaleDegree];
};

/**
 * Get the relative interval (steps within the current key and mode) based on the
 * position (pitch) in the scale.
 * @function
 * @param {number} interval - The interval value.
 * @param {string} keySignature - The key signature.
 * @param {string} pitch - The pitch (note name).
 * @returns {number} The relative interval value.
 */
const getInterval = (interval, keySignature, pitch) => {
    // Step size interval based on the position (pitch) in the scale
    const obj = buildScale(keySignature);
    const scale = obj[0];
    const halfSteps = obj[1];
    // Offet is used in the case that the pitch is not in the current scale.
    // let offset = 0;

    if (SOLFEGENAMES.indexOf(pitch) !== -1) {
        pitch = FIXEDSOLFEGE[pitch];
    }

    let ii;
    if (pitch in BTOFLAT) {
        pitch = BTOFLAT[pitch];
        ii = scale.indexOf(pitch);
    } else if (pitch in STOSHARP) {
        pitch = STOSHARP[pitch];
        ii = scale.indexOf(pitch);
    } else if (scale.indexOf(pitch) !== -1) {
        ii = scale.indexOf(pitch);
    } else {
        ii = scale.indexOf(pitch);
        if (ii === -1) {
            if (pitch in EQUIVALENTFLATS) {
                ii = scale.indexOf(EQUIVALENTFLATS[pitch]);
            }
        }

        if (ii === -1) {
            if (pitch in EQUIVALENTSHARPS) {
                ii = scale.indexOf(EQUIVALENTSHARPS[pitch]);
            }
        }

        if (ii === -1) {
            if (pitch in EQUIVALENTNATURALS) {
                ii = scale.indexOf(EQUIVALENTNATURALS[pitch]);
            }
        }

        let counter = 0;
        if (ii === -1) {
            // Pitch is not in the consonant scale of this key, so we need to
            // shift up or down for a close match, step up or down, and then
            // compensate for the shift.
            if (PITCHES.indexOf(pitch) !== -1) {
                while (scale.indexOf(pitch) === -1) {
                    counter += 1;
                    if (counter > 24) {
                        break;
                    }
                    let i = PITCHES.indexOf(pitch);
                    if (interval > 0) {
                        i += 1;
                        pitch = PITCHES[i % 12];
                        // offset -= 1;
                    } else {
                        i -= 1;
                        if (i < 0) {
                            i += 12;
                        }
                        pitch = PITCHES[i];
                        // offset += 1;
                    }
                }

                ii = scale.indexOf(pitch);
            } else {
                if (PITCHES2.indexOf(pitch) !== -1) {
                    while (scale.indexOf(pitch) === -1) {
                        counter += 1;
                        if (counter > 24) {
                            break;
                        }
                        let i = PITCHES2.indexOf(pitch);
                        if (interval > 0) {
                            i += 1;
                            pitch = PITCHES2[i % 12];
                            // offset -= 1;
                        } else {
                            i -= 1;
                            if (i < 0) {
                                i += 12;
                            }
                            pitch = PITCHES2[i];
                            // offset += 1;
                        }
                    }

                    ii = scale.indexOf(pitch);
                } else {
                    // Should never happen.
                    // eslint-disable-next-line no-console
                    console.debug(pitch + " not found");
                    return 0;
                }
            }
        }
    }

    // What do we do with the offset? Is it ignored? Or does it count
    // as one step in the interval?

    let j = 0;
    if (interval === 0) {
        return 0;
    } else if (interval > 0) {
        for (let k = 0; k < interval; k++) {
            j += halfSteps[(ii + k) % halfSteps.length];
        }
        return j;
    } else {
        for (let k = 0; k > interval; k--) {
            let z = (ii + k - 1) % halfSteps.length;
            while (z < 0) {
                z += halfSteps.length;
            }
            j -= halfSteps[z];
        }
        return j;
    }
};

/**
 * Get the reduced fraction representation of a fraction.
 * @function
 * @param {number} a - The numerator.
 * @param {number} b - The denominator.
 * @returns {string} The reduced fraction as a string.
 */
const reducedFraction = (a, b) => {
    const greatestCommonMultiple =  (a, b) => {
        return b === 0 ? a : greatestCommonMultiple(b, a % b);
    };

    const gcm = greatestCommonMultiple(a, b);

    if ([1, 2, 4, 8, 16].indexOf(b / gcm) !== -1) {
        return a / gcm + "<br>&mdash;<br>" + b / gcm + "<br>" + NSYMBOLS[b / gcm];
    } else {
        return a / gcm + "<br>&mdash;<br>" + b / gcm + "<br><br>";
    }
};

/**
 * Convert a floating-point number to its approximate fractional representation.
 * @function
 * @param {number} d - The floating-point number.
 * @returns {Array} An array containing the numerator and denominator of the fraction.
 */
const toFraction = (d) => {
    // Convert float to its approximate fractional representation.
    let flip = false;
    if (d > 1) {
        flip = true;
        d = 1 / d;
    }

    let df = 1.0;
    let top = 1;
    let bot = 1;

    while (Math.abs(df - d) > 0.00000001) {
        if (df < d) {
            top += 1;
        } else {
            bot += 1;
            top = parseInt(d * bot);
        }
        df = top / bot;
    }

    if (flip) {
        const tmp = top;
        top = bot;
        bot = tmp;
    }

    return [top, bot];
};

/**
 * Calculate the note value to display based on numerator and denominator.
 * @function
 * @param {number} a - The numerator.
 * @param {number} b - The denominator.
 * @returns {string} The note value to display.
 */
const calcNoteValueToDisplay = (a, b) => {
    const noteValue = a / b;
    let noteValueToDisplay = null;

    if (noteValue in NSYMBOLS) {
        noteValueToDisplay =
            "1<br>&mdash;<br>" + noteValue.toString() + "<br>" + NSYMBOLS[noteValue];
    } else {
        noteValueToDisplay = reducedFraction(b, a);
    }

    let value;
    let obj;
    let d0, d1;
    if (parseInt(noteValue) < noteValue) {
        noteValueToDisplay = parseInt(noteValue * 1.5);
        if (noteValueToDisplay in NSYMBOLS) {
            value = b / a; // * noteValueToDisplay;
            obj = toFraction(value);
            Number.isInteger(obj[0]) ? (d0 = 0) : (d0 = 2);
            Number.isInteger(obj[1]) ? (d1 = 0) : (d1 = 2);
            noteValueToDisplay =
                // value.toFixed(2) +
                obj[0].toFixed(d0) +
                "<br>&mdash;<br>" +
                // noteValueToDisplay.toString() +
                obj[1].toFixed(d1) +
                "<br>" +
                NSYMBOLS[noteValueToDisplay] +
                ".";
        } else {
            noteValueToDisplay = parseInt(noteValue * 1.75);
            if (noteValueToDisplay in NSYMBOLS) {
                value = b / a; // * noteValueToDisplay;
                obj = toFraction(value);
                Number.isInteger(obj[0]) ? (d0 = 0) : (d0 = 2);
                Number.isInteger(obj[1]) ? (d1 = 0) : (d1 = 2);
                noteValueToDisplay =
                    // value.toFixed(2) +
                    obj[0].toFixed(d0) +
                    "<br>&mdash;<br>" +
                    // noteValueToDisplay.toString() +
                    obj[1].toFixed(d1) +
                    "<br>" +
                    NSYMBOLS[noteValueToDisplay] +
                    "..";
            } else {
                noteValueToDisplay = reducedFraction(b, a);
            }
        }
    }

    return noteValueToDisplay;
};

/**
 * Convert a duration value to its note value representation.
 * @function
 * @param {number} duration - The duration value.
 * @returns {Array} An array containing the note value, number of dots, and tuplet factor.
 */
const durationToNoteValue = (duration) => {
    // returns [note value, no. of dots, tuplet factor]

    let currentDotFactor;
    let d;
    // Try to find a match or a dotted match.
    for (let dotCount = 0; dotCount < 3; dotCount++) {
        currentDotFactor = 2 - 1 / Math.pow(2, dotCount);
        d = duration * currentDotFactor;
        if (POWER2.indexOf(d) !== -1) {
            return [d, dotCount, null];
        }
    }

    // First, round down.
    let roundDown = duration;
    for (let i = 1; i < POWER2.length; i++) {
        // Rounding down
        if (roundDown < POWER2[i]) {
            roundDown = POWER2[i - 1];
            break;
        }
    }

    if (POWER2.indexOf(roundDown) === -1) {
        roundDown = 128;
    }

    // Convert duration into parts based on POW2 factors
    // e.g., 1 / 6 ==> [3, 2], 1 / 12 ==> [3, 4]
    let j = 1;
    while (Math.floor(duration / j) * j === duration) {
        j = j * 2;
        if (j > duration / 2) {
            break;
        }
    }

    j = j / 2;

    return [1, 0, [duration / j, j], roundDown];
};

/**
 * Convert a note string to pitch and octave.
 * @function
 * @param {string} note - The note string.
 * @returns {Array} An array containing pitch and octave.
 */
const noteToPitchOctave = (note) => {
    const len = note.length;
    return [note.substring(0, len - 1), Number(last(note))];
};

/**
 * Calculate the frequency based on pitch, octave, cents, and key signature.
 * @function
 * @param {string} pitch - The pitch of the note.
 * @param {number} octave - The octave of the note.
 * @param {number} cents - The cents to adjust the frequency.
 * @param {string} keySignature - The key signature.
 * @returns {number} The calculated frequency.
 */
const pitchToFrequency = (pitch, octave, cents, keySignature) => {
    // Calculate the frequency based on pitch and octave.
    const pitchNumber = pitchToNumber(pitch, octave, keySignature);

    if (cents === 0) {
        return A0 * Math.pow(TWELTHROOT2, pitchNumber);
    } else {
        return A0 * Math.pow(TWELVEHUNDRETHROOT2, pitchNumber * 100 + cents);
    }
};

/**
 * Convert a note string to frequency based on the key signature.
 * @function
 * @param {string} note - The note string.
 * @param {string} keySignature - The key signature.
 * @returns {number} The calculated frequency.
 */
const noteToFrequency = (note, keySignature) => {
    const obj = noteToPitchOctave(note);
    return pitchToFrequency(obj[0], obj[1], 0, keySignature);
};

/**
 * Check if a note string is in solfege.
 * @function
 * @param {string} note - The note string.
 * @returns {boolean} True if the note is in solfege, false otherwise.
 */
const noteIsSolfege = (note) => {
    if (SOLFEGECONVERSIONTABLE[note] === undefined) {
        return true;
    } else {
        return false;
    }
};

/**
 * Get the solfege representation of a note string.
 * @function
 * @param {string} note - The note string.
 * @returns {string} The solfege representation.
 */
const getSolfege = (note) => {
    // FIXME: Use mode-specific conversion.
    if (noteIsSolfege(note)) {
        return note;
    } else {
        return SOLFEGECONVERSIONTABLE[note];
    }
};

/**
 * Split a solfege value into pitch and attributes.
 * @function
 * @param {string} value - The solfege value.
 * @returns {Array} An array containing pitch and attributes.
 */
const splitSolfege = (value) => {
    // Separate the pitch from any attributes, e.g., # or b
    if (value != null && typeof value === "string") {
        let note, attr;
        if (SOLFNOTES.indexOf(value) !== -1) {
            note = value;
            attr = "";
        } else if (value.slice(0, 3) === "sol") {
            note = "sol";
            if (value.length === 4) {
                attr = value[3];
            } else {
                attr = value[3] + value[4];
            }
        } else {
            note = value.slice(0, 2);
            if (value.length === 3) {
                attr = value[2];
            } else {
                attr = value[2] + value[3];
            }
        }

        return [note, attr];
    }

    return ["sol", ""];
};

/**
 * Internationalize a solfege note using i18n.
 * @function
 * @param {string} note - The solfege note.
 * @returns {string} The internationalized solfege note.
 */
const i18nSolfege = (note) => {
    // solfnotes_ is used in the interface for i18n
    const solfnotes_ = _("ti la sol fa mi re do").split(" ");
    const obj = splitSolfege(note);

    const i = SOLFNOTES.indexOf(obj[0]);
    if (i !== -1) {
        return solfnotes_[i] + obj[1];
    } else {
        // Wasn't solfege so it doesn't need translation.
        return note;
    }
};

/**
 * Split a scale degree value into note and attributes.
 * @function
 * @param {string} value - The scale degree value.
 * @returns {Array} An array containing note and attributes.
 */
const splitScaleDegree = (value) => {
    if (!value) {
        return [5, NATURAL];
    }

    const note = value.slice(0, 1);
    const attr = value.slice(1);
    return [note, attr];
};

/**
 * Convert a number to a note with octave.
 * @function
 * @param {number} value - The number representing the note.
 * @param {number} delta - The delta to adjust the value.
 * @returns {Array} An array containing the note and octave.
 */
const getNumNote = (value, delta) => {
    // Converts from number to note
    let num = value + delta;
    let octave = Math.floor(num / 12);
    num = num % 12;

    const note = NOTESTABLE[num];

    if (note[num] === "ti") {
        octave -= 1;
    }

    return [note, octave + 1];
};

/**
 * Calculate the octave based on the current octave, argument, last note played, and current note.
 * @function
 * @param {number} currentOctave - The current octave.
 * @param {(number|string)} arg - The argument for octave calculation.
 * @param {Array} lastNotePlayed - The last note played.
 * @param {string} currentNote - The current note.
 * @returns {number} The calculated octave.
 */
const calcOctave = (currentOctave, arg, lastNotePlayed, currentNote) => {
    // Calculate the octave based on the current Octave and the arg,
    // which can be a number, a 'number' as a string, 'current',
    // 'previous', or 'next'.

    if (typeof arg === "number") {
        return Math.max(1, Math.min(Math.floor(arg), 9));
    }

    // The relative octave for tritones are arbitrated as being in the
    // current octave, so we need to determine the number of half
    // steps between lastNotePlayed and currentNote.
    let note, changedCurrent;

    if (SOLFEGENAMES1.indexOf(currentNote) !== -1) {
        note = FIXEDSOLFEGE1[currentNote];
    } else {
        note = currentNote;
    }

    const stepCurrentNote = getNumber(note, currentOctave);
    const stepUpCurrentNote = getNumber(note, currentOctave + 1);
    const stepDownCurrentNote = getNumber(note, currentOctave - 1);

    if (lastNotePlayed != null) {
        lastNotePlayed = lastNotePlayed[0];
        // strip off octave from end of note
        lastNotePlayed = lastNotePlayed.substring(0, lastNotePlayed.length - 1);
    } else {
        lastNotePlayed = "G";
    }

    const stepLastNotePlayed = getNumber(lastNotePlayed, currentOctave);

    const halfSteps = Math.abs(stepLastNotePlayed - stepCurrentNote);
    const halfStepsUp = Math.abs(stepLastNotePlayed - stepUpCurrentNote);
    const halfStepsDown = Math.abs(stepLastNotePlayed - stepDownCurrentNote);

    if (halfSteps <= 5 || isNaN(halfSteps)) {
        changedCurrent = currentOctave;
    }

    if (halfSteps > 5 && halfStepsUp > 5 && halfStepsDown < 5) {
        changedCurrent = Math.max(currentOctave - 1, 1);
    }

    if (halfSteps > 5 && halfStepsUp < 5 && halfStepsDown > 5) {
        changedCurrent = Math.min(currentOctave + 1, 9);
    }

    if (halfSteps > 5 && halfStepsUp > 5 && halfStepsDown > 5) {
        changedCurrent = currentOctave;
    }

    switch (arg) {
        case _("current"):
        case "current":
            return changedCurrent;
        case _("next"):
        case "next":
            return Math.min(changedCurrent + 1, 10);
        case _("previous"):
        case "previous":
            return Math.max(changedCurrent - 1, 1);
        default:
            try {
                if (changedCurrent) {
                    return changedCurrent;
                } else {
                    return Math.floor(Number(arg));
                }
            } catch (e) {
                // console.debug("cannot convert " + arg + " to a number");
                return currentOctave;
            }
    }
};

/**
 * Calculate the octave value based on the argument for intervals.
 * @function
 * @param {(number|string)} arg - The argument for interval octave calculation.
 * @returns {number} The calculated octave value.
 */
const calcOctaveInterval = arg => {
    // Used by intervals to determine octave to use in an interval.
    let value = 0;
    switch (arg) {
        case 1:
        case _("next"):
        case "next":
            value = 1;
            break;
        case -1:
        case _("previous"):
        case "previous":
            value = -1;
            break;
        case _("current"):
        case "current":
        case 0:
            value = 0;
            break;
        case 2:
            value = 2;
            break;
        case -2:
            value = -2;
            break;
        default:
            // eslint-disable-next-line no-console
            console.debug("Interval octave must be between -2 and 2.");
            value = 0;
            break;
    }

    return value;
};

/**
 * Check if a value is an integer.
 * @function
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value is an integer, false otherwise.
 */
const isInt = (value) => {
    return !isNaN(value) && parseInt(Number(value)) === value && !isNaN(parseInt(value, 10));
};

/**
 * Convert a solfege note to a common letter class.
 * @function
 * @param {string} note - The solfege note.
 * @returns {string} The converted note.
 */
const convertFromSolfege = (note) => {
    // Convert to common letter class
    if (note in FIXEDSOLFEGE1) {
        note = FIXEDSOLFEGE1[note];
    }
    if (note in EQUIVALENTNATURALS) {
        note = EQUIVALENTNATURALS[note];
    }
    return note;
};

/**
 * Convert a duration factor to a string representation.
 * @function
 * @param {number} factor - The duration factor to convert.
 * @returns {string|null} The string representation of the duration factor.
 */
const convertFactor = factor => {
    switch (factor) {
        case 0.0625: // 1/16
            return "16";
        case 0.125: // 1/8
            return "8";
        case 0.09375: // 3/32
            return "16.";
        case 0.1875: // 3/16
            return "8.";
        case 0.21875: // 7/32
            return "8..";
        case 0.25: // 1/4
            return "4";
        case 0.3125: // 5/16
            return "4 16";
        case 0.375: // 3/8
            return "4.";
        case 0.4375: // 7/16
            return "4..";
        case 0.5: // 1/2
            return "2";
        case 0.5625: // 9/16
            return "2 16";
        case 0.675: // 5/8
            return "2 8";
        case 0.6875: // 11/16
            return "2 8 16";
        case 0.75: // 3/4
            return "2.";
        case 0.8125: // 13/16
            return "2 4 16";
        case 0.875: // 7/8
            return "2..";
        case 0.9375: // 15/16
            return "2 4 8 16";
        case 1: // 1/1
            return "1";
        default:
            return null;
    }
};

/**
 * Get pitch information based on the activity, type, current note, and tur.
 * @function
 * @param {string} activity - The activity information.
 * @param {string} type - The type of pitch information to retrieve.
 * @param {string|number} currentNote - The current note or frequency.
 * @param {*} tur - The tur object.
 * @returns {*} The pitch information based on the specified type.
 */
const getPitchInfo = (activity, type, currentNote, tur) => {
    // A variety of conversions.
    let pitch;
    let octave;
    let obj;
    if (Number(currentNote)) {
        // If it is a frequency, convert it to a pitch/octave.
        obj = frequencyToPitch(currentNote);
        pitch = obj[0];
        octave = obj[1];
    } else {
        // Turn the note into pitch and octave.
        pitch = currentNote.substr(0, currentNote.length - 1);
        octave = currentNote[currentNote.length - 1];
    }
    // Remap double sharps/double flats.
    if (pitch.includes(DOUBLESHARP)) {
        pitch = pitch.replace(DOUBLESHARP, "");
        if (pitch === "B") {
            pitch = "C" + SHARP;
        } else {
            pitch = NOTESSHARP[NOTESSHARP.indexOf(pitch) + 2];
        }
    } else if (pitch.includes(DOUBLEFLAT)) {
        pitch = pitch.replace(DOUBLEFLAT, "");
        if (pitch === "C") {
            pitch = "B" + FLAT;
        } else {
            pitch = NOTESFLAT[NOTESFLAT.indexOf(pitch) - 2];
        }
    }
    // Map the pitch to the current scale.
    pitch = pitch.replace("#", SHARP).replace("b", FLAT);
    if (buildScale(tur.singer.keySignature)[0].indexOf(pitch) === -1) {
        if (pitch in EQUIVALENTFLATS) {
            pitch = EQUIVALENTFLATS[pitch];
        } else if (pitch in EQUIVALENTSHARPS) {
            pitch = EQUIVALENTSHARPS[pitch];
        }
    }

    try {
        switch (type) {
            case "alphabet":
                return pitch;
            case "alphabet class":
            case "letter class":
                return pitch[0];
            case "solfege syllable":
            case "solfege class":
                if (type === "solfege class") {
                    // Remove sharps and flats.
                    pitch = pitch.replace(SHARP).replace(FLAT);
                }
                if (tur.singer.movable === false) {
                    return SOLFEGECONVERSIONTABLE[pitch];
                }
                return SOLFEGENAMES[buildScale(tur.singer.keySignature)[0].indexOf(pitch)];
            case "pitch class":
                return ((pitchToNumber(pitch, octave, tur.singer.keySignature) - 3) % 12);
            case "scalar class":
                return scaleDegreeToPitchMapping(
                    tur.singer.keySignature,
                    null,
                    tur.singer.movable,
                    pitch
                )[0];
            case "scale degree":
                obj = scaleDegreeToPitchMapping(
                    tur.singer.keySignature,
                    null,
                    tur.singer.movable,
                    pitch
                );
                return (obj[0] + obj[1]);
            case "nth degree":
                return buildScale(tur.singer.keySignature)[0].indexOf(pitch);
            case "staff y":
                // these numbers are subject to staff artwork
                return (
                    ["C", "D", "E", "F", "G", "A", "B"].indexOf(pitch[0]) * YSTAFFNOTEHEIGHT +
                    (octave - 4) * YSTAFFOCTAVEHEIGHT
                );
            case "pitch number":
                return _calculate_pitch_number(activity, pitch, tur);
            case "pitch in hertz":
                return activity.logo.synth._getFrequency(
                    pitch + octave,
                    activity.logo.synth.changeInTemperament
                );
            case "pitch to color":
                if (NOTESSHARP.indexOf(pitch) !== -1) {
                    return NOTESSHARP.indexOf(pitch) * 8.33;
                } else if (NOTESFLAT.indexOf(pitch) !== -1) {
                    return NOTESFLAT.indexOf(pitch) * 8.33;
                }
                // eslint-disable-next-line no-console
                console.debug("Pitch not found: " + pitch);
                return 0;
            case "pitch to shade":
                return octave * 12.5;
            default:
                return "__INVALID_INPUT__";
        }
    } catch {
        // eslint-disable-next-line no-console
        console.debug("Waiting for note to play");
    }
};
