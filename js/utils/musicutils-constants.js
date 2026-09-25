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
   exported

   SYNTHSVG, WHOLENOTE, HALFNOTE, QUARTERNOTE, EIGHTHNOTE, SIXTEENTHNOTE,
   THIRTYSECONDNOTE, SIXTYFOURTHNOTE, SHARP, FLAT, CENTSSYMBOL, NATURAL,
   DOUBLESHARP, DOUBLEFLAT, NSYMBOLS, RSYMBOLS, BTOFLAT, STOSHARP,
   CHROMATIC_SOLFEGE, NOTESSHARP, NOTESFLAT, NOTESFLAT2, EQUIVALENTFLATS,
   EQUIVALENTSHARPS, EQUIVALENTNATURALS, EQUIVALENTACCIDENTALS, CONVERT_DOWN,
   CONVERT_DOUBLE_DOWN, CONVERT_UP, CONVERT_DOUBLE_UP, EXTRATRANSPOSITIONS,
   SOLFEGENAMES, SOLFEGENAMES1, NOTENAMES, ALLNOTENAMES, NOTENAMES1,
   WESTERN2EISOLFEGENAMES, PITCHES, PITCHES1, PITCHES2, PITCHES3, NOTESTABLE,
   FIXEDSOLFEGE, NOTESTEP, ALLNOTESTEP, SHARPPREFERENCE, FLATPREFERENCE,
   SOLFNOTES, SCALENOTES, EASTINDIANSOLFNOTES, DRUMS, GRAPHICS, SOLFATTRS,
   SEMITONES, CENTS_PER_SEMITONE, CENTS_PER_OCTAVE, POWER2, TWELTHROOT2,
   TWELVEHUNDRETHROOT2, A0, C8, C10, YSTAFFNOTEHEIGHT, YSTAFFOCTAVEHEIGHT,
   MATRIXSOLFEWIDTH, EIGHTHNOTEWIDTH, MATRIXBUTTONHEIGHT, MATRIXBUTTONHEIGHT2,
   MATRIXSOLFEHEIGHT, MusicUtilsConstants
 */

// var, not const: a hoisted var in musicutils.js cannot redeclare a top-level const.

/**
 * Scalable sinewave graphic.
 * @const
 * @type {string}
 */
var SYNTHSVG =
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?> <svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" y="0px" xml:space="preserve" x="0px" width="SVGWIDTHpx" viewBox="0 0 SVGWIDTH 55" version="1.1" height="55px" enable-background="new 0 0 SVGWIDTH 55"><g transform="scale(XSCALE,1)"><path d="m 1.5,27.5 c 0,0 2.2,-17.5 6.875,-17.5 4.7,0.0 6.25,11.75 6.875,17.5 0.75,6.67 2.3,17.5 6.875,17.5 4.1,0.0 6.25,-13.6 6.875,-17.5 C 29.875,22.65 31.1,10 35.875,10 c 4.1,0.0 5.97,13.0 6.875,17.5 1.15,5.7 1.75,17.5 6.875,17.5 4.65,0.0 6.875,-17.5 6.875,-17.5" style="stroke:#90c100;fill-opacity:1;fill:none;stroke-width:STROKEWIDTHpx;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /></g></svg>';

/**
 * Notes graphics.
 * @const
 * @type {string}
 */
var WHOLENOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="svg6468" viewBox="0 0 5.1680003 12.432" height="12.432" width="5.1680002"> <g transform="translate(-375.23523,-454.37592)"> <g transform="translate(7.9606,5.6125499)" style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 369.80263,457.99537 q 1.104,0 1.872,0.432 0.768,0.416 0.768,1.2 0,0.752 -0.752,1.168 -0.752,0.4 -1.808,0.4 -1.104,0 -1.856,-0.416 -0.752,-0.416 -0.752,-1.232 0,-0.576 0.464,-0.944 0.48,-0.368 1.008,-0.48 0.528,-0.128 1.056,-0.128 z m -0.864,1.136 q 0,0.672 0.304,1.184 0.304,0.512 0.784,0.512 0.736,0 0.736,-0.8 0,-0.64 -0.304,-1.136 -0.288,-0.512 -0.8,-0.512 -0.72,0 -0.72,0.752 z" /> </g> </g> </svg>';

var HALFNOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3.84 12.432" height="3.5085866mm" width="1.0837333mm"> <g transform="translate(-375.23523,-454.37592)"> <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 375.23523,465.70392 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-9.472 0.352,0 0,10.352 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 0.736,0.48 q 0.848,0 1.712,-0.72 0.88,-0.72 0.88,-1.072 0,-0.224 -0.192,-0.224 -0.592,0 -1.632,0.688 -1.024,0.672 -1.024,1.12 0,0.208 0.256,0.208 z" /> </g> </g> </svg>';

var QUARTERNOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4.0859801 11.74224" height="3.313921mm" width="1.1531544mm"> <g transform="translate(-226.1339,-457.841)"> <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 229.60268,457.841 0.5625,0 0.0547,0.0625 0,10.02344 q 0,1.27344 -1.53125,1.625 l -0.375,0.0313 -0.27343,0 q -1.65625,0 -1.875,-1.03906 l -0.0313,-0.24219 q 0,-1.01562 1.64843,-1.20312 l 0.25782,-0.0391 q 0.77343,0 1.47656,0.5 l 0.0313,0 0,-9.65625 0.0547,-0.0625 z" /> </g> </g> </svg>';

var EIGHTHNOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7.5234898 11.7422" height="3.3139098mm" width="2.123296mm"> <g transform="translate(-244.80575,-403.5553)"> <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 248.14955,403.5553 0.67969,0 0.0625,0.0547 0,0.30468 q 0.21094,0.42188 1.5625,0.91407 1.875,0.54687 1.875,1.625 0,1.14062 -0.95313,1.89062 l -0.0313,0 -0.23437,-0.25 q 0.47656,-0.38281 0.47656,-1.03906 0,-0.54688 -1.78125,-1.10156 -0.71875,-0.32813 -0.91406,-0.53125 l 0,8.32812 q 0,1.19531 -1.75,1.54688 l -0.44531,0 q -1.89063,0 -1.89063,-1.3125 0,-1.02344 1.65625,-1.20313 l 0.17969,0 q 0.75,0 1.44531,0.5 l 0,-9.67187 0.0625,-0.0547 z" /> </g> </g> </svg>';

var SIXTEENTHNOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7.0080001 12.432" height="3.5085866mm" width="1.9778134mm"> <g transform="translate(-182.21292,-431.51877)"> <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 182.21292,442.84677 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-9.472 0.336,0 q 0.064,0.56 0.4,1.088 0.352,0.512 0.8,0.944 0.448,0.416 0.88,0.864 0.448,0.432 0.752,1.024 0.304,0.576 0.304,1.232 0,0.544 -0.256,1.104 0.304,0.448 0.304,1.184 0,1.232 -0.608,2.24 l -0.384,0 q 0.56,-1.12 0.56,-2.032 0,-0.512 -0.256,-0.96 -0.24,-0.448 -0.752,-0.816 -0.496,-0.368 -0.832,-0.56 -0.32,-0.192 -0.896,-0.48 l 0,5.52 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 6.464,-5.904 q 0,-1.648 -2.624,-3.072 0,0.464 0.192,0.88 0.192,0.416 0.512,0.752 0.32,0.32 0.656,0.592 0.336,0.272 0.688,0.608 0.352,0.32 0.544,0.608 0.032,-0.256 0.032,-0.368 z" /> </g> </g> </svg>';

var THIRTYSECONDNOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7.0080001 14.496001" height="4.0910935mm" width="1.9778134mm"> <g transform="translate(-630.78433,-240.88335)">  <g  style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1">  <path  d="m 630.78433,254.27535 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-11.536 0.352,0 q 0.048,0.56 0.384,1.072 0.336,0.496 0.768,0.912 0.432,0.4 0.864,0.848 0.432,0.448 0.72,1.104 0.304,0.656 0.304,1.456 0,0.48 -0.16,1.056 0.224,0.416 0.224,0.912 0,0.512 -0.24,0.976 0.304,0.448 0.304,1.168 0,1.232 -0.608,2.24 l -0.384,0 q 0.56,-1.12 0.56,-2.032 0,-0.512 -0.256,-0.96 -0.24,-0.448 -0.752,-0.816 -0.496,-0.368 -0.832,-0.56 -0.32,-0.192 -0.896,-0.48 l 0,5.52 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 6.448,-7.872 q 0,-0.496 -0.208,-0.928 -0.192,-0.432 -0.64,-0.832 -0.432,-0.416 -0.784,-0.672 -0.352,-0.256 -0.976,-0.656 0.032,0.448 0.352,0.896 0.32,0.432 0.704,0.752 0.4,0.32 0.848,0.8 0.464,0.464 0.704,0.912 l 0,-0.272 z m 0,2.096 q 0,-0.4 -0.16,-0.768 -0.144,-0.368 -0.32,-0.608 -0.16,-0.256 -0.592,-0.608 -0.416,-0.352 -0.672,-0.528 -0.256,-0.176 -0.848,-0.576 0.064,0.48 0.4,0.976 0.336,0.48 0.72,0.816 0.4,0.336 0.832,0.784 0.448,0.432 0.64,0.784 l 0,-0.272 z" /> </g> </g> </svg>';

var SIXTYFOURTHNOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7.0080001 14.528" height="4.1001244mm" width="1.9778134mm"> <g transform="translate(-345.3223,-325.39492)"> <g transform="translate(3.1093785,1.6864426)" style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 342.21292,337.13248 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-11.568 0.336,0 q 0.064,0.64 0.384,1.104 0.336,0.464 0.752,0.768 0.416,0.304 0.832,0.656 0.416,0.336 0.688,0.928 0.288,0.592 0.288,1.44 0,0.24 -0.144,0.768 0.256,0.608 0.256,1.376 0,0.32 -0.16,0.896 0.224,0.416 0.224,0.912 0,0.496 -0.24,0.96 0.304,0.448 0.304,1.024 0,0.384 -0.08,0.688 -0.08,0.304 -0.16,0.448 -0.08,0.144 -0.368,0.608 l -0.384,0 q 0.08,-0.16 0.192,-0.368 0.112,-0.224 0.16,-0.32 0.064,-0.096 0.112,-0.24 0.064,-0.144 0.08,-0.288 0.016,-0.144 0.016,-0.32 0,-0.272 -0.096,-0.512 -0.08,-0.256 -0.176,-0.432 -0.096,-0.192 -0.32,-0.4 -0.224,-0.208 -0.368,-0.32 -0.144,-0.128 -0.464,-0.304 -0.304,-0.192 -0.432,-0.256 -0.128,-0.064 -0.48,-0.224 -0.336,-0.176 -0.4,-0.208 l 0,4.064 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 6.352,-8.384 q 0,-0.352 -0.144,-0.688 -0.128,-0.352 -0.288,-0.576 -0.16,-0.224 -0.48,-0.496 -0.32,-0.272 -0.512,-0.4 -0.192,-0.144 -0.592,-0.384 -0.384,-0.24 -0.496,-0.32 0.032,0.432 0.352,0.832 0.32,0.384 0.704,0.656 0.4,0.272 0.816,0.72 0.432,0.432 0.624,0.912 0.016,-0.176 0.016,-0.256 z m 0.016,2.128 q 0,-0.208 -0.048,-0.4 -0.032,-0.192 -0.08,-0.336 -0.048,-0.16 -0.176,-0.336 -0.128,-0.176 -0.208,-0.288 -0.08,-0.112 -0.272,-0.272 -0.192,-0.176 -0.288,-0.256 -0.096,-0.08 -0.352,-0.256 -0.24,-0.176 -0.336,-0.224 -0.096,-0.064 -0.384,-0.24 -0.288,-0.192 -0.384,-0.256 0.032,0.464 0.368,0.88 0.336,0.416 0.736,0.704 0.4,0.272 0.816,0.688 0.416,0.416 0.576,0.864 0.032,-0.192 0.032,-0.272 z m -0.016,1.936 q 0,-0.848 -0.624,-1.504 -0.608,-0.672 -1.872,-1.392 0.064,0.464 0.384,0.896 0.336,0.416 0.72,0.688 0.4,0.272 0.8,0.704 0.4,0.416 0.576,0.88 0.016,-0.064 0.016,-0.272 z" /> </g> </g> </svg>';

/**
 * Symbol for a sharp note.
 * @constant {string}
 * @default
 */
var SHARP = "♯";

/**
 * Symbol for a flat note.
 * @constant {string}
 * @default
 */
var FLAT = "♭";

/**
 * Symbol for cents.
 *
 * Cents are a logarithmic unit for measuring musical intervals:
 *   - 1 cent = 1/1200 of an octave (12-EDO semitone = 100 cents)
 *   - To convert a ratio to cents: cents = 1200 * log2(ratio)
 *   - To convert cents to a frequency multiplier: multiplier = 2^(cents/1200)
 *
 * Examples:
 *   12-EDO step = 100 ¢ (1200 / 12)
 *   5-EDO  step = 240 ¢ (1200 / 5)
 *   19-EDO step ≈ 63.16 ¢ (1200 / 19)
 *
 * Example: A4 = 440 Hz, A4 + 33 ¢ = 440 * 2^(33/1200) ≈ 448.17 Hz
 *
 * @constant {string}
 * @default
 */
var CENTSSYMBOL = "\u00A2";

/**
 * Symbol for a natural note.
 * @constant {string}
 * @default
 */
var NATURAL = "♮";

/**
 * Symbol for a double sharp note.
 * @constant {string}
 * @default
 */
var DOUBLESHARP = "𝄪";

/**
 * Symbol for a double flat note.
 * @constant {string}
 * @default
 */
var DOUBLEFLAT = "𝄫";

/**
 * Symbols representing different note durations.
 * @constant {Object.<number, string>}
 * @default
 */
var NSYMBOLS = { 1: "𝅝", 2: "𝅗𝅥", 4: "♩", 8: "♪", 16: "𝅘𝅥𝅯" };

/**
 * Symbols representing different rest durations.
 * @constant {Object.<number, string>}
 * @default
 */
var RSYMBOLS = { 1: "𝄻", 2: "𝄼", 4: "𝄽", 8: "𝄾", 16: "𝄿" };

/**
 * Maps from notes with flats to their corresponding notes with '♭' (flat) symbol.
 * @constant {Object.<string, string>}
 */
var BTOFLAT = {
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
var STOSHARP = {
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
 * Array containing the solfege names for the chromatic scale.
 * @constant {string[]}
 */
var CHROMATIC_SOLFEGE = [
    "Do", // 0
    "Di", // 1
    "Re", // 2
    "Ri", // 3
    "Mi", // 4
    "Fa", // 5
    "Fi", // 6
    "Sol", // 7
    "Si", // 8
    "La", // 9
    "Li", // 10
    "Ti" // 11
];

/**
 * Array of notes with sharps.
 * @constant {string[]}
 */
var NOTESSHARP = [
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
var NOTESFLAT = [
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
var NOTESFLAT2 = [
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
var EQUIVALENTFLATS = {
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
var EQUIVALENTSHARPS = {
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
var EQUIVALENTNATURALS = {
    "E♯": "F",
    "B♯": "C",
    "C♭": "B",
    "F♭": "E",
    "D𝄪": "E",
    "A𝄪": "B",
    "G𝄪": "A",
    "E𝄪": "F♯",
    "C𝄪": "D",
    "F𝄪": "G",
    "B𝄪": "C♯",
    "C𝄫": "B♭",
    "D𝄫": "C",
    "E𝄫": "D",
    "F𝄫": "E♭",
    "G𝄫": "F",
    "A𝄫": "G",
    "B𝄫": "A",
    // Two-character forms (from _parse_pitch_string normalization)
    "D♯♯": "E",
    "A♯♯": "B",
    "G♯♯": "A",
    "E♯♯": "F♯",
    "C♯♯": "D",
    "F♯♯": "G",
    "B♯♯": "C♯",
    "C♭♭": "B♭",
    "D♭♭": "C",
    "E♭♭": "D",
    "F♭♭": "E♭",
    "G♭♭": "F",
    "A♭♭": "G",
    "B♭♭": "A"
};

/**
 * Maps from natural notes to their equivalent notes with specific accidentals.
 * @constant {Object.<string, string>}
 */
var EQUIVALENTACCIDENTALS = { F: "E♯", C: "B♯", B: "C♭", E: "F♭", G: "F𝄪", D: "C𝄪", A: "G𝄪" };

/**
 * Converts a note down to a flat note.
 * @const
 * @type {Object.<string, string>}
 */
var CONVERT_DOWN = {
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
var CONVERT_DOUBLE_DOWN = {
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
var CONVERT_UP = {
    "C♯": "D" + FLAT,
    "D♯": "E" + FLAT,
    "E♯": "F",
    "E": "F" + FLAT,
    "F♯": "G" + FLAT,
    "G♯": "A" + FLAT,
    "A♯": "B" + FLAT,
    "B♯": "C",
    "B": "C" + FLAT
};

/**
 * Maps from notes with specific accidentals to their equivalent notes after a double-up transposition.
 * @constant {Object.<string, string>}
 */
var CONVERT_DOUBLE_UP = {
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
var EXTRATRANSPOSITIONS = {
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
var SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti"];

/**
 * Array containing the solfege names for the chromatic scale.
 * @constant {string[]}
 */
var SOLFEGENAMES1 = [
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
    "la" + DOUBLEFLAT,
    "la" + FLAT,
    "la",
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
var NOTENAMES = ["C", "D", "E", "F", "G", "A", "B"];

/**
 * Array containing all possible note names, including double sharps/flats and triple sharps/flats.
 * @constant {string[]}
 */
var ALLNOTENAMES = [
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
var NOTENAMES1 = [
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
    "A" + DOUBLEFLAT,
    "A" + FLAT,
    "A",
    "A" + SHARP,
    "A" + DOUBLESHARP,
    "B" + DOUBLEFLAT,
    "B" + FLAT,
    "B"
];

/**
 * Maps from Western solfege names to their corresponding Carnatic solfege names.
 * @constant {Object.<string, string>}
 */
var WESTERN2EISOLFEGENAMES = {
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
var PITCHES = [
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
var PITCHES1 = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

/**
 * Array containing pitches with sharps.
 * @constant {string[]}
 */
var PITCHES2 = [
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
var PITCHES3 = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * Maps from numerical values to solfege names.
 * @constant {Object.<number, string>}
 */
var NOTESTABLE = {
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
var FIXEDSOLFEGE = {
    do: "C",
    re: "D",
    mi: "E",
    fa: "F",
    sol: "G",
    la: "A",
    ti: "B"
};

/**
 * Maps from note names to their corresponding step numbers.
 * @constant {Object.<string, number>}
 */
var NOTESTEP = { C: 1, D: 3, E: 5, F: 6, G: 8, A: 10, B: 12 };

/**
 * Maps note names to their corresponding step numbers, including enharmonic equivalents.
 * @constant {Object.<number, string>}
 */
var ALLNOTESTEP = {
    "Cb": 0,
    "C": 1,
    "C#": 2,
    "Db": 2,
    "D": 3,
    "D#": 4,
    "Eb": 4,
    "E": 5,
    "E#": 6,
    "Fb": 5,
    "F": 6,
    "F#": 7,
    "Gb": 7,
    "G": 8,
    "G#": 9,
    "Ab": 9,
    "A": 10,
    "A#": 11,
    "Bb": 11,
    "B": 12,
    "B#": 0
};

/**
 * Array containing preferences for keys with sharps.
 * @constant {string[]}
 */
var SHARPPREFERENCE = [
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
var FLATPREFERENCE = [
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
var SOLFNOTES = ["ti", "la", "sol", "fa", "mi", "re", "do"];

/**
 * Scale notes used in selectors.
 * @constant {string[]}
 */
var SCALENOTES = ["7", "6", "5", "4", "3", "2", "1"];

/**
 * Carnatic solfege notes.
 * @constant {string[]}
 */
var EASTINDIANSOLFNOTES = ["ni", "dha", "pa", "ma", "ga", "re", "sa"];

/**
 * Drum names used in selectors.
 * @constant {string[]}
 */
var DRUMS = [
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
var GRAPHICS = [
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

/**
 * Solfège attributes including double sharp, sharp, natural, flat, and double flat.
 * @constant {string[]}
 */
var SOLFATTRS = [DOUBLESHARP, SHARP, NATURAL, FLAT, DOUBLEFLAT];

/**
 * Number of semitones in an octave.
 * @constant {number}
 */
var SEMITONES = 12;

/**
 * Number of cents per semitone in 12-TET tuning.
 * @constant {number}
 */
var CENTS_PER_SEMITONE = 100;

/**
 * Number of cents in an octave.
 * Derived from SEMITONES for future temperament support.
 * @constant {number}
 */
var CENTS_PER_OCTAVE = SEMITONES * CENTS_PER_SEMITONE;

/**
 * Array representing powers of 2.
 * @constant {number[]}
 */
var POWER2 = [1, 2, 4, 8, 16, 32, 64, 128];

var TWELTHROOT2 = 1.0594630943592953;

var TWELVEHUNDRETHROOT2 = 1.0005777895065549;

/**
 * Frequency of A in octave 0, in Hz.
 * @constant {number}
 */
var A0 = 27.5;

/**
 * Frequency of C in octave 8, in Hz.
 * @constant {number}
 */
var C8 = 4186.01;

/**
 * Frequency of C in octave 10, in Hz.
 * @constant {number}
 */
var C10 = 16744.04;

/**
 * Height of a staff note.
 * @constant {number}
 */
var YSTAFFNOTEHEIGHT = 12.5;

/**
 * Height of a staff octave.
 * @constant {number}
 */
var YSTAFFOCTAVEHEIGHT = 87.5;

/**
 * Width of matrix solfege.
 * @constant {number}
 */
var MATRIXSOLFEWIDTH = 52;

/**
 * Width of an eighth note.
 * @constant {number}
 */
var EIGHTHNOTEWIDTH = 24;

/**
 * Height of matrix buttons.
 * @constant {number}
 */
var MATRIXBUTTONHEIGHT = 40;

/**
 * Height of matrix buttons.
 * @constant {number}
 */
var MATRIXBUTTONHEIGHT2 = 66;

/**
 * Height of matrix solfege.
 * @constant {number}
 */
var MATRIXSOLFEHEIGHT = 30;

var MusicUtilsConstants = {
    SYNTHSVG,
    WHOLENOTE,
    HALFNOTE,
    QUARTERNOTE,
    EIGHTHNOTE,
    SIXTEENTHNOTE,
    THIRTYSECONDNOTE,
    SIXTYFOURTHNOTE,
    SHARP,
    FLAT,
    CENTSSYMBOL,
    NATURAL,
    DOUBLESHARP,
    DOUBLEFLAT,
    NSYMBOLS,
    RSYMBOLS,
    BTOFLAT,
    STOSHARP,
    CHROMATIC_SOLFEGE,
    NOTESSHARP,
    NOTESFLAT,
    NOTESFLAT2,
    EQUIVALENTFLATS,
    EQUIVALENTSHARPS,
    EQUIVALENTNATURALS,
    EQUIVALENTACCIDENTALS,
    CONVERT_DOWN,
    CONVERT_DOUBLE_DOWN,
    CONVERT_UP,
    CONVERT_DOUBLE_UP,
    EXTRATRANSPOSITIONS,
    SOLFEGENAMES,
    SOLFEGENAMES1,
    NOTENAMES,
    ALLNOTENAMES,
    NOTENAMES1,
    WESTERN2EISOLFEGENAMES,
    PITCHES,
    PITCHES1,
    PITCHES2,
    PITCHES3,
    NOTESTABLE,
    FIXEDSOLFEGE,
    NOTESTEP,
    ALLNOTESTEP,
    SHARPPREFERENCE,
    FLATPREFERENCE,
    SOLFNOTES,
    SCALENOTES,
    EASTINDIANSOLFNOTES,
    DRUMS,
    GRAPHICS,
    SOLFATTRS,
    SEMITONES,
    CENTS_PER_SEMITONE,
    CENTS_PER_OCTAVE,
    POWER2,
    TWELTHROOT2,
    TWELVEHUNDRETHROOT2,
    A0,
    C8,
    C10,
    YSTAFFNOTEHEIGHT,
    YSTAFFOCTAVEHEIGHT,
    MATRIXSOLFEWIDTH,
    EIGHTHNOTEWIDTH,
    MATRIXBUTTONHEIGHT,
    MATRIXBUTTONHEIGHT2,
    MATRIXSOLFEHEIGHT
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicUtilsConstants;
}

if (typeof window !== "undefined") {
    window.MusicUtilsConstants = MusicUtilsConstants;
}
