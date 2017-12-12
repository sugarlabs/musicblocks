// Copyright (c) 2016-17 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Scalable sinewave graphic
const SYNTHSVG = '<?xml version="1.0" encoding="UTF-8" standalone="no"?> <svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" y="0px" xml:space="preserve" x="0px" width="SVGWIDTHpx" viewBox="0 0 SVGWIDTH 55" version="1.1" height="55px" enable-background="new 0 0 SVGWIDTH 55"><g transform="scale(XSCALE,1)"><path d="m 1.5,27.5 c 0,0 2.2,-17.5 6.875,-17.5 4.7,0.0 6.25,11.75 6.875,17.5 0.75,6.67 2.3,17.5 6.875,17.5 4.1,0.0 6.25,-13.6 6.875,-17.5 C 29.875,22.65 31.1,10 35.875,10 c 4.1,0.0 5.97,13.0 6.875,17.5 1.15,5.7 1.75,17.5 6.875,17.5 4.65,0.0 6.875,-17.5 6.875,-17.5" style="stroke:#90c100;fill-opacity:1;fill:none;stroke-width:STROKEWIDTHpx;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /></g></svg>';

// Notes graphics
const WHOLENOTE = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="svg6468" viewBox="0 0 5.1680003 12.432" height="12.432" width="5.1680002"> <g transform="translate(-375.23523,-454.37592)"> <g transform="translate(7.9606,5.6125499)" style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 369.80263,457.99537 q 1.104,0 1.872,0.432 0.768,0.416 0.768,1.2 0,0.752 -0.752,1.168 -0.752,0.4 -1.808,0.4 -1.104,0 -1.856,-0.416 -0.752,-0.416 -0.752,-1.232 0,-0.576 0.464,-0.944 0.48,-0.368 1.008,-0.48 0.528,-0.128 1.056,-0.128 z m -0.864,1.136 q 0,0.672 0.304,1.184 0.304,0.512 0.784,0.512 0.736,0 0.736,-0.8 0,-0.64 -0.304,-1.136 -0.288,-0.512 -0.8,-0.512 -0.72,0 -0.72,0.752 z" /> </g> </g> </svg>';

const HALFNOTE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3.84 12.432" height="3.5085866mm" width="1.0837333mm"> <g transform="translate(-375.23523,-454.37592)"> <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 375.23523,465.70392 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-9.472 0.352,0 0,10.352 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 0.736,0.48 q 0.848,0 1.712,-0.72 0.88,-0.72 0.88,-1.072 0,-0.224 -0.192,-0.224 -0.592,0 -1.632,0.688 -1.024,0.672 -1.024,1.12 0,0.208 0.256,0.208 z" /> </g> </g> </svg>';

const QUARTERNOTE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4.0859801 11.74224" height="3.313921mm" width="1.1531544mm"> <g transform="translate(-226.1339,-457.841)"> <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 229.60268,457.841 0.5625,0 0.0547,0.0625 0,10.02344 q 0,1.27344 -1.53125,1.625 l -0.375,0.0313 -0.27343,0 q -1.65625,0 -1.875,-1.03906 l -0.0313,-0.24219 q 0,-1.01562 1.64843,-1.20312 l 0.25782,-0.0391 q 0.77343,0 1.47656,0.5 l 0.0313,0 0,-9.65625 0.0547,-0.0625 z" /> </g> </g> </svg>';

const EIGHTHNOTE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7.5234898 11.7422" height="3.3139098mm" width="2.123296mm"> <g transform="translate(-244.80575,-403.5553)"> <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 248.14955,403.5553 0.67969,0 0.0625,0.0547 0,0.30468 q 0.21094,0.42188 1.5625,0.91407 1.875,0.54687 1.875,1.625 0,1.14062 -0.95313,1.89062 l -0.0313,0 -0.23437,-0.25 q 0.47656,-0.38281 0.47656,-1.03906 0,-0.54688 -1.78125,-1.10156 -0.71875,-0.32813 -0.91406,-0.53125 l 0,8.32812 q 0,1.19531 -1.75,1.54688 l -0.44531,0 q -1.89063,0 -1.89063,-1.3125 0,-1.02344 1.65625,-1.20313 l 0.17969,0 q 0.75,0 1.44531,0.5 l 0,-9.67187 0.0625,-0.0547 z" /> </g> </g> </svg>';

const SIXTEENTHNOTE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7.0080001 12.432" height="3.5085866mm" width="1.9778134mm"> <g transform="translate(-182.21292,-431.51877)"> <g style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 182.21292,442.84677 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-9.472 0.336,0 q 0.064,0.56 0.4,1.088 0.352,0.512 0.8,0.944 0.448,0.416 0.88,0.864 0.448,0.432 0.752,1.024 0.304,0.576 0.304,1.232 0,0.544 -0.256,1.104 0.304,0.448 0.304,1.184 0,1.232 -0.608,2.24 l -0.384,0 q 0.56,-1.12 0.56,-2.032 0,-0.512 -0.256,-0.96 -0.24,-0.448 -0.752,-0.816 -0.496,-0.368 -0.832,-0.56 -0.32,-0.192 -0.896,-0.48 l 0,5.52 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 6.464,-5.904 q 0,-1.648 -2.624,-3.072 0,0.464 0.192,0.88 0.192,0.416 0.512,0.752 0.32,0.32 0.656,0.592 0.336,0.272 0.688,0.608 0.352,0.32 0.544,0.608 0.032,-0.256 0.032,-0.368 z" /> </g> </g> </svg>';

const THIRTYSECONDNOTE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7.0080001 14.496001" height="4.0910935mm" width="1.9778134mm"> <g transform="translate(-630.78433,-240.88335)">  <g  style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1">  <path  d="m 630.78433,254.27535 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-11.536 0.352,0 q 0.048,0.56 0.384,1.072 0.336,0.496 0.768,0.912 0.432,0.4 0.864,0.848 0.432,0.448 0.72,1.104 0.304,0.656 0.304,1.456 0,0.48 -0.16,1.056 0.224,0.416 0.224,0.912 0,0.512 -0.24,0.976 0.304,0.448 0.304,1.168 0,1.232 -0.608,2.24 l -0.384,0 q 0.56,-1.12 0.56,-2.032 0,-0.512 -0.256,-0.96 -0.24,-0.448 -0.752,-0.816 -0.496,-0.368 -0.832,-0.56 -0.32,-0.192 -0.896,-0.48 l 0,5.52 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 6.448,-7.872 q 0,-0.496 -0.208,-0.928 -0.192,-0.432 -0.64,-0.832 -0.432,-0.416 -0.784,-0.672 -0.352,-0.256 -0.976,-0.656 0.032,0.448 0.352,0.896 0.32,0.432 0.704,0.752 0.4,0.32 0.848,0.8 0.464,0.464 0.704,0.912 l 0,-0.272 z m 0,2.096 q 0,-0.4 -0.16,-0.768 -0.144,-0.368 -0.32,-0.608 -0.16,-0.256 -0.592,-0.608 -0.416,-0.352 -0.672,-0.528 -0.256,-0.176 -0.848,-0.576 0.064,0.48 0.4,0.976 0.336,0.48 0.72,0.816 0.4,0.336 0.832,0.784 0.448,0.432 0.64,0.784 l 0,-0.272 z" /> </g> </g> </svg>';

const SIXTYFOURTHNOTE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7.0080001 14.528" height="4.1001244mm" width="1.9778134mm"> <g transform="translate(-345.3223,-325.39492)"> <g transform="translate(3.1093785,1.6864426)" style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"> <path d="m 342.21292,337.13248 q 0,-0.832 0.816,-1.472 0.816,-0.656 1.728,-0.656 0.528,0 0.944,0.272 l 0,-11.568 0.336,0 q 0.064,0.64 0.384,1.104 0.336,0.464 0.752,0.768 0.416,0.304 0.832,0.656 0.416,0.336 0.688,0.928 0.288,0.592 0.288,1.44 0,0.24 -0.144,0.768 0.256,0.608 0.256,1.376 0,0.32 -0.16,0.896 0.224,0.416 0.224,0.912 0,0.496 -0.24,0.96 0.304,0.448 0.304,1.024 0,0.384 -0.08,0.688 -0.08,0.304 -0.16,0.448 -0.08,0.144 -0.368,0.608 l -0.384,0 q 0.08,-0.16 0.192,-0.368 0.112,-0.224 0.16,-0.32 0.064,-0.096 0.112,-0.24 0.064,-0.144 0.08,-0.288 0.016,-0.144 0.016,-0.32 0,-0.272 -0.096,-0.512 -0.08,-0.256 -0.176,-0.432 -0.096,-0.192 -0.32,-0.4 -0.224,-0.208 -0.368,-0.32 -0.144,-0.128 -0.464,-0.304 -0.304,-0.192 -0.432,-0.256 -0.128,-0.064 -0.48,-0.224 -0.336,-0.176 -0.4,-0.208 l 0,4.064 q 0,0.896 -0.784,1.488 -0.784,0.592 -1.728,0.592 -0.528,0 -0.928,-0.304 -0.4,-0.32 -0.4,-0.8 z m 6.352,-8.384 q 0,-0.352 -0.144,-0.688 -0.128,-0.352 -0.288,-0.576 -0.16,-0.224 -0.48,-0.496 -0.32,-0.272 -0.512,-0.4 -0.192,-0.144 -0.592,-0.384 -0.384,-0.24 -0.496,-0.32 0.032,0.432 0.352,0.832 0.32,0.384 0.704,0.656 0.4,0.272 0.816,0.72 0.432,0.432 0.624,0.912 0.016,-0.176 0.016,-0.256 z m 0.016,2.128 q 0,-0.208 -0.048,-0.4 -0.032,-0.192 -0.08,-0.336 -0.048,-0.16 -0.176,-0.336 -0.128,-0.176 -0.208,-0.288 -0.08,-0.112 -0.272,-0.272 -0.192,-0.176 -0.288,-0.256 -0.096,-0.08 -0.352,-0.256 -0.24,-0.176 -0.336,-0.224 -0.096,-0.064 -0.384,-0.24 -0.288,-0.192 -0.384,-0.256 0.032,0.464 0.368,0.88 0.336,0.416 0.736,0.704 0.4,0.272 0.816,0.688 0.416,0.416 0.576,0.864 0.032,-0.192 0.032,-0.272 z m -0.016,1.936 q 0,-0.848 -0.624,-1.504 -0.608,-0.672 -1.872,-1.392 0.064,0.464 0.384,0.896 0.336,0.416 0.72,0.688 0.4,0.272 0.8,0.704 0.4,0.416 0.576,0.88 0.016,-0.064 0.016,-0.272 z" /> </g> </g> </svg>';

// is there a "proper" double-sharp symbol as well? I see this from wikipedia: U+1D12A 𝄪 MUSICAL SYMBOL DOUBLE SHARP (HTML &#119082;) (https://en.wikipedia.org/wiki/Double_sharp)
const SHARP = '♯';
const FLAT = '♭';
const BTOFLAT = {'Eb': 'E♭', 'Gb': 'G♭', 'Ab': 'A♭', 'Bb': 'B♭', 'Db': 'D♭', 'Cb': 'C♭', 'Fb': 'F♭', 'eb': 'E♭', 'gb': 'G♭', 'ab': 'A♭', 'bb': 'B♭', 'db': 'D♭', 'cb': 'C♭', 'fb': 'F♭'};
const STOSHARP = {'E#': 'E♯', 'G#': 'G♯', 'A#': 'A♯', 'B#': 'B♯', 'D#': 'D♯', 'C#': 'C♯', 'F#': 'F♯', 'e#': 'E♯', 'g#': 'G♯', 'a#': 'A♯', 'b#': 'B♯', 'd#': 'D♯', 'c#': 'C♯', 'f#': 'F♯'};
const NOTESSHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const NOTESFLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const NOTESFLAT2 = ['c', 'd♭', 'd', 'e♭', 'e', 'f', 'g♭', 'g', 'a♭', 'a', 'b♭', 'b'];
const EQUIVALENTFLATS = {'C♯': 'D♭', 'D♯': 'E♭', 'F♯': 'G♭', 'G♯': 'A♭', 'A♯': 'B♭'};
const EQUIVALENTSHARPS = {'D♭': 'C♯', 'E♭': 'D♯', 'G♭': 'F♯', 'A♭': 'G♯', 'B♭': 'A♯'};
const EQUIVALENTNATURALS = {'E♯': 'F', 'B♯': 'C', 'C♭': 'B', 'F♭': 'E'};
const EXTRATRANSPOSITIONS = {'E♯': ['F', 0], 'B♯': ['C', 1], 'C♭': ['B', -1], 'F♭': ['E', 0], 'e♯': ['F', 0], 'b♯': ['C', 1], 'c♭': ['B', -1], 'f♭': ['E', 0]};
const SOLFEGENAMES = ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'];
const SOLFEGECONVERSIONTABLE = {'C': 'do', 'C♯': 'do' + '♯', 'D': 're', 'D♯': 're' + '♯', 'E': 'mi', 'F': 'fa', 'F♯': 'fa' + '♯', 'G': 'sol', 'G♯': 'sol' + '♯', 'A': 'la', 'A♯': 'la' + '♯', 'B': 'ti', 'D♭': 're' + '♭', 'E♭': 'mi' + '♭', 'G♭': 'sol' + '♭', 'A♭': 'la' + '♭', 'B♭': 'ti' + '♭', 'R': _('rest')};
const WESTERN2EISOLFEGENAMES = {'do': 'sa', 're': 're', 'mi': 'ga', 'fa': 'ma', 'sol': 'pa', 'la': 'dha', 'ti': 'ni'};

const PITCHES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const PITCHES1 = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const PITCHES2 = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const PITCHES3 = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTESTABLE = {1: 'do', 2: 'do♯', 3: 're', 4: 're♯', 5: 'mi', 6: 'fa', 7: 'fa♯', 8: 'sol', 9: 'sol♯', 10: 'la', 11: 'la♯', 0: 'ti'};
const FIXEDSOLFEGE = {'do': 'C', 're': 'D', 'mi': 'E', 'fa': 'F', 'sol': 'G', 'la': 'A', 'ti': 'B'};
const NOTESTEP = {'C': 1, 'D': 3, 'E': 5, 'F': 6, 'G': 8, 'A': 10, 'B': 12};

// Preference for sharps or flats
const SHARPPREFERENCE = ['g major', 'd major', 'a major', 'e major', 'b major', 'f# major', 'c# major', 'e minor', 'b minor', 'f# minor', 'c# minor', 'g# minor', 'd# minor'];
const FLATPREFERENCE = ['f major', 'bb major', 'eb major', 'ab major', 'db major', 'gb major', 'cb major', 'd minor', 'g minor', 'c minor', 'f minor', 'bb minor', 'eb minor'];

// SOLFNOTES is the internal representation used in selectors
const SOLFNOTES = ['ti', 'la', 'sol', 'fa', 'mi', 're', 'do'];
const EASTINDIANSOLFNOTES = ['ni', 'dha', 'pa', 'ma', 'ga', 're', 'sa']
// const ARETINIANSOLFNOTES = ['si', 'la', 'sol', 'fa', 'mi', 're', 'ut']; //the "original solfege" https://en.wikipedia.org/wiki/Solf%C3%A8ge#Origin
// const IROHASOLFNOTES = ['ro', 'i', 'to', 'he', 'ho', 'ni', 'ha']; //https://en.wikipedia.org/wiki/Iroha
// const IROHASOLFNOTESJA = ['ロ','イ','ト','へ','ホ','二','ハ'];
const SOLFATTRS = ['♯♯', '♯', '♮', '♭', '♭♭'];


function getSharpFlatPreference (keySignature) {
    if (SHARPPREFERENCE.indexOf(keySignature.toLowerCase()) !== -1) {
        return 'sharp';
    } else if (FLATPREFERENCE.indexOf(keySignature.toLowerCase()) !== -1) {
        return 'flat';
    } else {
        return 'natural';
    }
};


function mod12(a) {
    while (a < 0) {
        a += 12;
    }

    return a % 12;
}

const SEMITONES = 12;
const POWER2 = [1, 2, 4, 8, 16, 32, 64, 128];
const TWELTHROOT2 = 1.0594630943592953;
const TWELVEHUNDRETHROOT2 = 1.0005777895065549;
const A0 = 27.5;
const C8 = 4186.01;

const RHYTHMRULERHEIGHT = 100;

const SLIDERHEIGHT = 200;
const SLIDERWIDTH = 50;

const MATRIXBUTTONCOLOR = '#c374e9';
const MATRIXLABELCOLOR = '#90c100';
const MATRIXNOTECELLCOLOR = '#b1db00';
const MATRIXTUPLETCELLCOLOR = '#57e751';
const MATRIXRHYTHMCELLCOLOR = '#c8c8c8';

const MATRIXBUTTONCOLORHOVER = '#c894e0';
const MATRIXNOTECELLCOLORHOVER = '#c2e820';

const MATRIXSOLFEWIDTH = 52;
const EIGHTHNOTEWIDTH = 24;
const MATRIXBUTTONHEIGHT = 40;
const MATRIXBUTTONHEIGHT2 = 66;
const MATRIXSOLFEHEIGHT = 30;

const wholeNoteImg = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(WHOLENOTE)));
const halfNoteImg = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(HALFNOTE)));
const quarterNoteImg = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(QUARTERNOTE)));
const eighthNoteImg = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(EIGHTHNOTE)));
const sixteenthNoteImg = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(SIXTEENTHNOTE)));
const thirtysecondNoteImg = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(THIRTYSECONDNOTE)));
const sixtyfourthNoteImg = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(SIXTYFOURTHNOTE)));

const NOTESYMBOLS = {1: wholeNoteImg, 2: halfNoteImg, 4: quarterNoteImg, 8: eighthNoteImg, 16: sixteenthNoteImg, 32: thirtysecondNoteImg, 64: sixtyfourthNoteImg};

const INTERVALNAMES = [
    [_('unison'), 'unison'],
    [_('augmented') + ' 1', 'augmented 1'],
    [_('diminished') + ' 2', 'diminished 2'],
    [_('minor') + ' 2', 'minor 2'],
    [_('major') + ' 2', 'major 2'],
    [_('augmented') + ' 2', 'augmented 2'],
    [_('diminished') + ' 3', 'diminished 3'],
    [_('minor') + ' 3', 'minor 3'],
    [_('major') + ' 3', 'major 3'],
    [_('augmented') + ' 3', 'augmented 3'],
    [_('diminished') + ' 4', 'diminished 4'],
    [_('perfect') + ' 4', 'perfect 4'],
    [_('augmented') + ' 4', 'augmented 4'],
    [_('diminished') + ' 5', 'diminished 5'],
    [_('perfect') + ' 5', 'perfect 5'],
    [_('augmented') + ' 5', 'augmented 5'],
    [_('diminished') + ' 6', 'diminished 6'],
    [_('minor') + ' 6', 'minor 6'],
    [_('major') + ' 6', 'major 6'],
    [_('augmented') + ' 6', 'augmented 6'],
    [_('diminished') + ' 7', 'diminished 7'],
    [_('minor') + ' 7', 'minor 7'],
    [_('major') + ' 7', 'major 7'],
    [_('augmented') + ' 7', 'augmented 7'],
    [_('diminished') + ' 8', 'diminished 8'],
    [_('perfect') + ' 8', 'perfect 8'],
    [_('augmented') + ' 8', 'augmented 8'],
];

// [semi-tones, direction -1 == down; 0 == neutral; 1 == up]
const INTERVALVALUES = {
    'unison': [0, 0],
    'augmented 1': [1, 1],
    'diminished 2': [0, -1],
    'minor 2': [1, -1],
    'major 2': [2, 1],
    'augmented 2': [3, 1],
    'diminished 3': [2, -1],
    'minor 3': [3, -1],
    'major 3': [4, 1],
    'augmented 3': [5, 1],
    'diminished 4': [4, -1],
    'perfect 4': [5, 0],
    'augmented 4': [6, 1],
    'diminished 5': [6, -1],
    'perfect 5': [7, 0],
    'augmented 5': [8, 1],
    'diminished 6': [7, -1],
    'minor 6': [8, -1],
    'major 6': [9, 1],
    'augmented 6': [10, 1],
    'diminished 7': [9, -1],
    'minor 7': [10, -1],
    'major 7': [11, 1],
    'augmented 7': [12, 1],
    'diminished 8': [11, -1],
    'perfect 8': [12, 0],
    'augmented 8': [13, 1]
};

// The table contains the intervals that define the modes.
// All of these modes assume 12 semitones per octave.
// See http://www.pianoscales.org <== this is in no way definitive
// TODO: better system of organizing and naming collections of pitches
const MUSICALMODES = {
     // 12 notes in an octave
    'chromatic': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],

     // 8 notes in an octave
    'algerian': [2, 1, 2, 1, 1, 1, 3, 1],
    'diminished': [2, 1, 2, 1, 2, 1, 2, 1],
    'spanish': [1, 2, 1, 1, 1, 2, 2, 2],
    'ocatonic': [1, 2, 1, 2, 1, 2, 1, 2],

     // 7 notes in an octave
    'major': [2, 2, 1, 2, 2, 2, 1],
    'harmonic major': [2, 2, 1, 2, 1, 3, 1],
    'natural minor': [2, 1, 2, 2, 1, 2, 2],
    'harmonic minor': [2, 1, 2, 2, 1, 3, 1],
    'melodic minor': [2, 1, 2, 2, 2, 2, 1],

    'ionian': [2, 2, 1, 2, 2, 2, 1],
    'dorian': [2, 1, 2, 2, 2, 1, 2],
    'phrygian': [1, 2, 2, 2, 1, 2, 2],
    'lydian': [2, 2, 2, 1, 2, 2, 1],
    'mixolydian': [2, 2, 1, 2, 2, 1, 2],
    'aeolian': [2, 1, 2, 2, 1, 2, 2],
    'locrian': [1, 2, 2, 1, 2, 2, 2],

    'jazz minor': [2, 1, 2, 2, 2, 2, 1],
    'bebop': [1, 1, 1, 2, 2, 1, 2],

    'arabic': [2, 2, 1, 1, 2, 2, 2],
    'byzantine': [1, 3, 1, 2, 1, 3, 1],
    'enigmatic': [1, 3, 2, 2, 2, 1, 1],
    'ethiopian': [2, 1, 2, 2, 1, 2, 2],
    'geez': [2, 1, 2, 2, 1, 2, 2],
    'hindu': [2, 2, 1, 2, 1, 2, 2],
    'hungarian': [2, 1, 3, 1, 1, 3, 1],
    'maqam': [1, 3, 1, 2, 1, 3, 1],
    'romanian minor': [2, 1, 3, 1, 2, 1, 2],
    'spanish gypsy': [1, 3, 1, 2, 1, 2, 2],

     // 6 notes in an octave
    'minor blues': [3, 2, 1, 1, 3, 2],
    'major blues': [2, 1, 1, 3, 2, 2],
    'whole tone': [2, 2, 2, 2, 2, 2],

     // 5 notes in an octave
    'minor pentatonic': [3, 2, 2, 3, 2], //pentatonic is a general term that means "five note scale". This scale is typically known as "minor pentatonic"
    'chinese': [4, 2, 1, 4, 1],
    'egyptian': [2, 3, 2, 3, 2],
    'hirajoshi (Japan)': [1, 4, 1, 4, 2], //https://en.wikipedia.org/wiki/Hirajoshi_scale NOTE: There are three different versions of this scale
    'in (Japan)': [1, 4, 2, 1, 4], //https://en.wikipedia.org/wiki/In_scale and https://en.wikipedia.org/wiki/Sakura_Sakura
    'minyo (Japan)': [3, 2, 2, 3, 2], //https://en.wikipedia.org/wiki/Miny%C5%8D_scale
    'fibonacci': [1, 1, 2, 3, 5],

     // User definition overrides this constant
    'custom': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

const MAQAMTABLE = {
    'hijaz kar': 'C maqam',
    'hijaz kar maqam': 'C maqam',
    'shahnaz': 'D maqam',
    'maqam mustar': 'Eb maqam',
    'maqam jiharkah': 'F maqam',
    'shadd araban': 'G maqam',
    'suzidil': 'A maqam',
    'ajam': 'Bb maqam',
    'ajam maqam': 'Bb maqam',
};

var MODENAMES = [
    //.TRANS: twelve semi-tone scale for music
    [_('chromatic'), 'chromatic'],
    [_('algerian'), 'algerian'],
    //.TRANS: modal scale for music
    [_('diminished'), 'diminished'],
    [_('spanish'), 'spanish'],
    //.TRANS: modal scale for music
    [_('octatonic'), 'octatonic'],
    //.TRANS: major scales in music
    [_('major'), 'major'],
    //.TRANS: harmonic major scale in music
    [_('harmonic major'), 'harmonic major'],
    //.TRANS: natural minor scales in music
    [_('natural minor'), 'natural minor'],
    //.TRANS: harmonic minor scale in music
    [_('harmonic minor'), 'harmonic minor'],
    //.TRANS: melodic minor scale in music
    [_('melodic minor'), 'melodic minor'],
    //.TRANS: modal scale for music
    [_('ionian'), 'ionian'],
    //.TRANS: modal scale for music
    [_('dorian'), 'dorian'],
    //.TRANS: modal scale for music
    [_('phrygian'), 'phrygian'],
    //.TRANS: modal scale for music
    [_('lydian'), 'lydian'],
    //.TRANS: modal scale for music
    [_('mixolydian'), 'mixolydian'],
    //.TRANS: modal scale for music
    [_('aeolian'), 'aeolian'],
    //.TRANS: modal scale for music
    [_('locrian'), 'locrian'],
    //.TRANS: minor jazz scale for music
    [_('jazz minor'), 'jazz minor'],
    //.TRANS: bebop scale for music
    [_('bebop'), 'bebop'],
    [_('arabic'), 'arabic'],
    [_('byzantine'), 'byzantine'],
    //.TRANS: musical scale for music by Verdi
    [_('enigmatic'), 'enigmatic'],
    [_('ethiopian'), 'ethiopian'],
    //.TRANS: Ethiopic scale for music
    [_('geez'), 'geez'],
    [_('hindu'), 'hindu'],
    [_('hungarian'), 'hungarian'],
    //.TRANS: minor Romanian scale for music
    [_('romanian minor'), 'romanian minor'],
    [_('spanish gypsy'), 'spanish gypsy'],
    //.TRANS: musical scale for Mid-Eastern music
    [_('maqam'), 'maqam'],
    //.TRANS: minor blues scale for music
    [_('minor blues'), 'minor blues'],
    //.TRANS: major blues scale for music
    [_('major blues'), 'major blues'],
    [_('whole tone'), 'whole tone'],
    //.TRANS: pentatonic scale in music
    [_('minor pentatonic'), 'minor pentatonic'],
    [_('chinese'), 'chinese'],
    [_('egyptian'), 'egyptian'],
    //.TRANS: Japanese pentatonic scale for music
    [_('hirajoshi (Japan)'), 'hirajoshi (Japan)'],
    [_('in (Japan)'), 'in (Japan)'],
    [_('minyo (Japan)'), 'minyo (Japan)'],
    [_('japanese'), 'japanese'],
    //.TRANS: Italian mathematician
    [_('fibonacci'), 'fibonacci'],
    [_('custom'), 'custom'],
];

var VOICENAMES = [
    //.TRANS: musical instrument
    [_('violin'), 'violin', 'images/voices.svg'],
    //.TRANS: musical instrument
    [_('cello'), 'cello', 'images/voices.svg'],
    //.TRANS: musical instrument
    // [_('bass'), 'basse', 'images/voices.svg'],
    //.TRANS: musical instrument
    [_('guitar'), 'guitar', 'images/voices.svg'],
    //.TRANS: musical instrument
    [_('flute'), 'flute', 'images/voices.svg'],
    //.TRANS: polytone synthesizer
    [_('default'), 'default', 'images/synth.svg'],
    //.TRANS: simple monotone synthesizer
    [_('simple 1'), 'mono1', 'images/synth.svg'],
    //.TRANS: simple monotone synthesizer
    [_('simple 2'), 'mono2', 'images/synth.svg'],
    //.TRANS: simple monotone synthesizer
    [_('simple 3'), 'mono3', 'images/synth.svg'],
    //.TRANS: simple monotone synthesizer
    [_('simple 4'), 'mono4', 'images/synth.svg'],
    //.TRANS: white noise synthesizer
    [_('white noise'), 'noise1', 'images/synth.svg'],
    //.TRANS: brown noise synthesizer
    [_('brown noise'), 'noise2', 'images/synth.svg'],
    //.TRANS: pink noise synthesizer
    [_('pink noise'), 'noise3', 'images/synth.svg'],
    //.TRANS: sine wave
    [_('sine'), 'sine', 'images/synth.svg'],
    //.TRANS: square wave
    [_('square'), 'square', 'images/synth.svg'],
    //.TRANS: sawtooth wave
    [_('sawtooth'), 'sawtooth', 'images/synth.svg'],
    //.TRANS: triangle wave
    [_('triangle'), 'triangle', 'images/synth.svg'],
    //.TRANS: customize voice
    [_('custom'), 'custom', 'images/synth.svg'],
];

var DRUMNAMES = [
    //.TRANS: musical instrument
    [_('snare drum'), 'snare drum', 'images/snaredrum.svg'],
    //.TRANS: musical instrument
    [_('kick drum'), 'kick drum', 'images/kick.svg'],
    //.TRANS: musical instrument
    [_('tom tom'), 'tom tom', 'images/tom.svg'],
    //.TRANS: musical instrument
    [_('floor tom tom'), 'floor tom tom', 'images/floortom.svg'],
    //.TRANS: a drum made from an inverted cup
    [_('cup drum'), 'cup drum', 'images/cup.svg'],
    //.TRANS: musical instrument
    [_('darbuka drum'), 'darbuka drum', 'images/darbuka.svg'],
    //.TRANS: musical instrument
    [_('hi hat'), 'hi hat', 'images/hihat.svg'],
    //.TRANS: a small metal bell
    [_('ride bell'), 'ride bell', 'images/ridebell.svg'],
    //.TRANS: musical instrument
    [_('cow bell'), 'cow bell', 'images/cowbell.svg'],
    //.TRANS: musical instrument
    [_('triangle bell'), 'trianglebell', 'images/trianglebell.svg'],
    //.TRANS: musical instrument
    [_('finger cymbals'), 'finger cymbals', 'images/fingercymbals.svg'],
    //.TRANS: a musically tuned set of bells
    [_('chime'), 'chine', 'images/chine.svg'],
    //.TRANS: sound effect
    [_('clang'), 'clang', 'images/clang.svg'],
    //.TRANS: sound effect
    [_('crash'), 'crash', 'images/crash.svg'],
    //.TRANS: sound effect
    [_('bottle'), 'bottle', 'images/bottle.svg'],
    //.TRANS: sound effect
    [_('clap'), 'clap', 'images/clap.svg'],
    //.TRANS: sound effect
    [_('slap'), 'slap', 'images/slap.svg'],
    //.TRANS: sound effect
    [_('splash'), 'splash', 'images/splash.svg'],
    //.TRANS: sound effect
    [_('bubbles'), 'bubbles', 'images/bubbles.svg'],
    //.TRANS: animal sound effect
    [_('cat'), 'cat', 'images/cat.svg'],
    //.TRANS: animal sound effect
    [_('cricket'), 'cricket', 'images/cricket.svg'],
    //.TRANS: animal sound effect
    [_('dog'), 'dog', 'images/dog.svg'],
    //.TRANS: animal sound effect
    [_('duck'), 'duck', 'images/duck.svg'],
];

var FILTERTYPES = [
    //.TRANS: highpass filter
    [_('highpass'), 'highpass'],
    //.TRANS: lowpass filter
    [_('lowpass'), 'lowpass'],
    //.TRANS: bandpass filter
    [_('bandpass'), 'bandpass'],
    //.TRANS: highshelf filter
    [_('highshelf'), 'highshelf'],
    //.TRANS: lowshelf filter
    [_('lowshelf'), 'lowshelf'],
    //.TRANS: notch filter
    [_('notch'), 'notch'],
    //.TRANS: allpass filter
    [_('allpass'), 'allpass'],
    //.TRANS: peaking filter
    [_('peaking'), 'peaking'],
];

var OSCTYPES = [
    //.TRANS: sine wave
    [_('sine'), 'sine'],
    //.TRANS: square wave
    [_('square'), 'square'],
    //.TRANS: triangle wave
    [_('triangle'), 'triangle'],
    //.TRANS: sawtooth wave
    [_('sawtooth'), 'sawtooth'],
];

const DEFAULTINTERVAL = _('perfect') + ' 5';
const DEFAULTVOICE = 'sine';
const DEFAULTDRUM = 'kick drum';
const DEFAULTMODE = 'major';
const DEFAULTFILTERTYPE = 'highpass';
const DEFAULTOSCILLATORTYPE = 'sine';

var customMode = MUSICALMODES['custom'];

// The sample has a pitch which is subsequently transposed.
// This number is that starting pitch number. Reference function pitchToNumber
const SAMPLECENTERNO = {
  'violin': 51,
  'cello': 39,
  'basse': 15,
  'guitar': 39,
  'flute': 57
};


function getIntervalName(name) {
    for (var interval in INTERVALNAMES) {
        if (INTERVALNAMES[interval][0] === name || INTERVALNAMES[interval][1].toLowerCase() === name.toLowerCase()) {
            if (INTERVALNAMES[interval][0] != '') {
                return INTERVALNAMES[interval][0];
            } else {
                console.log('I18n for interval name is misbehaving.');
                console.log(name + ' ' + name.toLowerCase() + ' ' + INTERVALNAMES[interval][0].toLowerCase() + ' ' + INTERVALNAMES[interval][1].toLowerCase());
                return INTERVALNAMES[interval][1];
            }
        }
    }

    console.log(name + ' not found in INTERVALNAMES');
    return name;
};


function getIntervalNumber(name) {
    for (var interval in INTERVALNAMES) {
        if (INTERVALNAMES[interval][0] === name) {
	    return INTERVALVALUES[INTERVALNAMES[interval][1]][0];
	} else if (INTERVALNAMES[interval][1] === name) {
	    return INTERVALVALUES[INTERVALNAMES[interval][1]][0];
	}
    }

    console.log(name + ' not found in INTERVALNAMES');
    return 0;
};


function getIntervalDirection(name) {
    for (var interval in INTERVALNAMES) {
        if (INTERVALNAMES[interval][0] === name) {
	    return INTERVALVALUES[INTERVALNAMES[interval][1]][1];
	} else if (INTERVALNAMES[interval][1] === name) {
	    return INTERVALVALUES[INTERVALNAMES[interval][1]][1];
	}
    }

    console.log(name + ' not found in INTERVALNAMES');
    return 0;
};


function getModeName(name) {
    for (var mode in MODENAMES) {
        if (MODENAMES[mode][0] === name || MODENAMES[mode][1].toLowerCase() === name.toLowerCase()) {
            if (MODENAMES[mode][0] != '') {
                return MODENAMES[mode][0];
            } else {
                console.log('I18n for mode name is misbehaving.');
                console.log(name + ' ' + name.toLowerCase() + ' ' + MODENAMES[mode][0].toLowerCase() + ' ' + MODENAMES[mode][1].toLowerCase());
                return MODENAMES[mode][1];
            }
        }
    }

    console.log(name + ' not found in MODENAMES');
    return name;
};


function initIntervalI18N() {
    for (var i = 0; i < INTERVALNAMES.length; i++) {
      if (INTERVALNAMES[i][0] == null) {
            INTERVALNAMES[i][0] = _(INTERVALNAMES[i][1]);
          }

        if (INTERVALNAMES[i][0] == null) {
            INTERVALNAMES[i][0] = INTERVALNAMES[i][1];
        }
    }
};


function initFilterI18N() {
    for (var i = 0; i < FILTERTYPES.length; i++) {
      if (FILTERTYPES[i][0] == null) {
            FILTERTYPES[i][0] = _(FILTERTYPES[i][1]);
          }

        if (FILTERTYPES[i][0] == null) {
            FILTERTYPES[i][0] = FILTERTYPES[i][1];
        }
    }
};


function initOscI18N() {
    for (var i = 0; i < OSCTYPES.length; i++) {
      if (OSCTYPES[i][0] == null) {
            OSCTYPES[i][0] = _(OSCTYPES[i][1]);
          }

        if (OSCTYPES[i][0] == null) {
            OSCTYPES[i][0] = OSCTYPES[i][1];
        }
    }
};


function initModeI18N() {
    for (var i = 0; i < MODENAMES.length; i++) {
      if (MODENAMES[i][0] == null) {
            MODENAMES[i][0] = _(MODENAMES[i][1]);
          }

        if (MODENAMES[i][0] == null) {
            MODENAMES[i][0] = MODENAMES[i][1];
        }
    }
};


function initVoiceI18N() {
    for (var i = 0; i < VOICENAMES.length; i++) {
        if (VOICENAMES[i][0] == null) {
            VOICENAMES[i][0] = _(VOICENAMES[i][1]);
        }

        if (VOICENAMES[i][0] == null) {
            VOICENAMES[i][0] = VOICENAMES[i][1];
        }
    }
};


function initDrumI18N() {
    for (var i = 0; i < DRUMNAMES.length; i++) {
        if (DRUMNAMES[i][0] == null || DRUMNAMES[i][0] === '') {
            DRUMNAMES[i][0] = _(DRUMNAMES[i][1]);
        }

        if (DRUMNAMES[i][0] == null) {
            DRUMNAMES[i][0] = DRUMNAMES[i][1];
        }
    }
};


function getDrumName(name) {
    if (name === '') {
        console.log('getDrumName passed blank name. Returning ' + DEFAULTDRUM);
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) == 'http') {
        return null;
    }

    for (var drum = 0; drum < DRUMNAMES.length; drum++) {
        if (DRUMNAMES[drum][0].toLowerCase() === name.toLowerCase() || DRUMNAMES[drum][1].toLowerCase() === name.toLowerCase()) {
            if (DRUMNAMES[drum][0] != '') {
                return DRUMNAMES[drum][0];
            } else {
                console.log('I18n is misbehaving when parsing drum name: ' + name);
                return DRUMNAMES[drum][1];
            }
        }
    }

    return null;
};


function getFilterTypes(name) {
    if (name === '') {
        console.log('getFiterType passed blank name. Returning ' + DEFAULTFILTERTYPE);
        name = DEFAULTFILTERTYPE;
    }
    for (var type = 0; type < FILTERTYPES.length; type++) {
        if (FILTERTYPES[type][0].toLowerCase() === name.toLowerCase() || FILTERTYPES[type][1].toLowerCase() === name.toLowerCase()) {
            if (FILTERTYPES[type][0] != '') {
                return FILTERTYPES[type][0];
            } else {
                console.log('I18n is misbehaving when parsing filter type: ' + name);
                return FILTERTYPES[type][1];
            }
        }
    }

    return null;
};


function getOscillatorTypes(name) {
    if (name === '') {
        console.log('getOscillatorType passed blank name. Returning ' + DEFAULTOSCILLATORTYPE);
        name = DEFAULTOSCILLATORTYPE;
    }
    for (var type = 0; type < OSCTYPES.length; type++) {
        if (OSCTYPES[type][0].toLowerCase() === name.toLowerCase() || OSCTYPES[type][1].toLowerCase() === name.toLowerCase()) {
            if (OSCTYPES[type][0] != '') {
                return OSCTYPES[type][0];
            } else {
                console.log('I18n is misbehaving when parsing oscillator type: ' + name);
                return OSCTYPES[type][1];
            }
        }
    }

    return null;
};


function getDrumIcon(name) {
    if (name === '') {
        console.log('getDrumIcon passed blank name. Returning ' + DEFAULTDRUM);
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) == 'http') {
        return 'images/drum.svg';
    }

    for (var i = 0; i < DRUMNAMES.length; i++) {
        // if (DRUMNAMES[i].indexOf(name) !== -1) {
        if (DRUMNAMES[i][0] === name || DRUMNAMES[i][1].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[i][2];
        }
    }
    return 'images/drum.svg';
};


function getDrumSynthName(name) {
    if (name == null || name == undefined) {
        console.log('getDrumSynthName passed null name. Returning null');
        return null;
    } else if (name === '') {
        console.log('getDrumSynthName passed blank name. Returning ' + DEFAULTDRUM);
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) == 'http') {
        return name;
    }

    for (var i = 0; i < DRUMNAMES.length; i++) {
        // if (DRUMNAMES[i].indexOf(name) !== -1) {
        if (DRUMNAMES[i][0] === name || DRUMNAMES[i][1].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[i][1];
        }
    }
    return null;
};


function getVoiceName(name) {
    if (name === '') {
        console.log('getVoiceName passed blank name. Returning ' + DEFAULTVOICE);
        name = DEFAULTVOICE;
    } else if (name.slice(0, 4) == 'http') {
        return null;
    }

    for (var i = 0; i < VOICENAMES.length; i++) {
        if (VOICENAMES[i][0] === name || VOICENAMES[i][1] === name) {
            if (VOICENAMES[i][0] != '') {
                return VOICENAMES[i][0];
            } else {
                console.log('I18n is misbehaving when parsing voice name: ' + name);
                return VOICENAMES[i][1];
            }
        }
    }
    return null;
};


function getVoiceIcon(name) {
    if (name === '') {
        console.log('getVoiceIcon passed blank name. Returning ' + DEFAULTVOICE);
        name = DEFAULTVOICE;
    } else if (name.slice(0, 4) == 'http') {
        return 'images/voices.svg';
    }

    for (var i = 0; i < VOICENAMES.length; i++) {
        if (VOICENAMES[i][0] === name || VOICENAMES[i][1] === name) {
            return VOICENAMES[i][2];
        }
    }
    return 'images/voices.svg';
};


function getVoiceSynthName(name) {
    if (name == null || name == undefined) {
        console.log('getVoiceSynthName passed null name. Returning null');
        return null;
    } else if (name === '') {
        console.log('getVoiceSynthName passed blank name. Returning ' + DEFAULTVOICE);
        name = DEFAULTVOICE;
    } else if (name.slice(0, 4) == 'http') {
        return name;
    }

    for (var i = 0; i < VOICENAMES.length; i++) {
        if (VOICENAMES[i][0] === name || VOICENAMES[i][1] === name) {
            return VOICENAMES[i][1];
        }
    }
    return null;
};


function keySignatureToMode(keySignature) {
    // Convert from "A Minor" to "A" and "MINOR"
    if (keySignature === '') {
        console.log('No key signature provided; reverting to C major.');
       return ['C', 'major'];
    }

    // Maqams have special names for certain keys.
    if (keySignature.toLowerCase() in MAQAMTABLE) {
        keySignature = MAQAMTABLE[keySignature.toLowerCase()];
    }

    var parts = keySignature.split(' ');

    // A special case to test: m used for minor.
    var minorMode = false;
    if (parts.length === 1 && parts[0][parts[0].length - 1] === 'm') {
        minorMode = true;
        parts[0] = parts[0].slice(0, parts[0].length - 1);
    }

    if (parts[0] in BTOFLAT) {
        var key = BTOFLAT[parts[0]];
    } else if (parts[0] in STOSHARP) {
        var key = STOSHARP[parts[0]];
    } else {
        var key = parts[0];
    }

    if (NOTESSHARP.indexOf(key) === -1 && NOTESFLAT.indexOf(key) === -1) {
        console.log('Invalid key or missing name; reverting to C.');
        // Is is possible that the key was left out?
        var keySignature = 'C ' + keySignature;
        var parts = keySignature.split(' ');
        key = 'C';
    }

    if (minorMode) {
        return [key, 'natural minor'];
    }

    // Reassemble remaining parts to get mode name
    var mode = '';
    for (var i = 1; i < parts.length; i++) {
        if (parts[i] !== '') {
            if (mode === '') {
                mode = parts[i];
            } else {
                mode += ' ' + parts[i];
            }
        }
    }

    if (mode === '') {
        mode = 'major';
    } else {
        mode = mode.toLowerCase();
    }

    mode = getModeName(mode);

    for (var i = 0; i < MODENAMES.length; i++) {
        if (MODENAMES[i][0] === mode) {
            mode = MODENAMES[i][1];
            break;
        }
    }

    if (mode in MUSICALMODES) {
        return [key, mode];
    } else {
        console.log('Invalid mode name: ' + mode + ' reverting to major.');
        return [key, 'major'];
    }
};


function getStepSizeUp(keySignature, pitch) {
    return _getStepSize(keySignature, pitch, 'up');
};


function getStepSizeDown(keySignature, pitch) {
    return _getStepSize(keySignature, pitch, 'down');
};


function getModeLength(keySignature) {
    var obj = _buildScale(keySignature);
    return obj[1].length;
};


function _getStepSize(keySignature, pitch, direction) {
    // Returns how many half-steps to the next note in this key.
    var thisPitch = pitch;
    var obj = _buildScale(keySignature);
    var scale = obj[0];
    var halfSteps = obj[1];

    if (thisPitch in BTOFLAT) {
        thisPitch = BTOFLAT[thisPitch];
    } else if (thisPitch in STOSHARP) {
        thisPitch = STOSHARP[thisPitch];
    }

    var ii = scale.indexOf(thisPitch);
    if (ii !== -1) {
        if (direction === 'up') {
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
        if (direction === 'up') {
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
    var offset = 0;
    var i = PITCHES.indexOf(thisPitch);
    if (i !== -1) {
        while (scale.indexOf(thisPitch) === -1) {
            var i = PITCHES.indexOf(thisPitch);
            if (i === -1) {
		i = PITCHES2.indexOf(thisPitch);
            }

            if (direction === 'up') {
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

    var i = PITCHES2.indexOf(thisPitch);
    if (i !== -1) {
        while (scale.indexOf(thisPitch) === -1) {
            var i = PITCHES2.indexOf(thisPitch);
            if (i === -1) {
		i = PITCHES.indexOf(thisPitch);
            }

            if (direction === 'up') {
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
    console.log(thisPitch + ' not found');
    return 0;
};


function _buildScale(keySignature) {
    var obj = keySignatureToMode(keySignature);
    var myKeySignature = obj[0];
    if (obj[1] === 'CUSTOM') {
        var halfSteps = customMode;
    } else {
        var halfSteps = MUSICALMODES[obj[1]];
    }

    if (NOTESFLAT.indexOf(myKeySignature) !== -1) {
        var thisScale = NOTESFLAT;
    } else {
        var thisScale = NOTESSHARP;
    }

    var idx = thisScale.indexOf(myKeySignature);

    if (idx === -1) {
        idx = 0;
    }

    var scale = [myKeySignature];
    var ii = idx;
    for (var i = 0; i < halfSteps.length; i++) {
        ii += halfSteps[i];
        scale.push(thisScale[ii % SEMITONES]);
    }

    return [scale, halfSteps];
}


function scaleDegreeToPitch(keySignature, scaleDegree) {
    // Returns note corresponding to scale degree in current key
    // signature. Used for moveable solfege.
    var obj = _buildScale(keySignature);
    var scale = obj[0];

    // Scale degree is specified as do == 1, re == 2, etc., so we need
    // to subtract 1 to make it zero-based.
    scaleDegree -= 1;

    // We mod to ensure we don't run out of notes.
    // FixMe: bump octave if we wrap.
    scaleDegree %= (scale.length - 1);
    return (scale[scaleDegree]);
};


function getScaleAndHalfSteps(keySignature) {
    // Determine scale and half-step pattern from key signature
    var obj = keySignatureToMode(keySignature);
    var myKeySignature = obj[0];
    if (obj[1] === 'CUSTOM') {
        var halfSteps = customMode;
    } else {
        var halfSteps = MUSICALMODES[obj[1]];
    }

    var solfege = [];
    for (var i = 0; i < halfSteps.length; i++) {
        solfege.push(SOLFEGENAMES[i]);
        for (var j = 1; j < halfSteps[i]; j++) {
            solfege.push('');
        }
    }

    if (NOTESFLAT.indexOf(myKeySignature) !== -1) {
        var thisScale = NOTESFLAT;
    } else {
        var thisScale = NOTESSHARP;
    }

    if (myKeySignature in EXTRATRANSPOSITIONS) {
        myKeySignature = EXTRATRANSPOSITIONS[myKeySignature][0];
    }

    return [thisScale, solfege, myKeySignature, obj[1]];
};


// Relative interval (used by the Interval Block) is based on the
// steps within the current key and mode.
function getInterval (interval, keySignature, pitch) {
    // Step size interval based on the position (pitch) in the scale
    var obj = _buildScale(keySignature);
    var scale = obj[0];
    var halfSteps = obj[1];
    // Offet is used in the case that the pitch is not in the current scale.
    var offset = 0;

    if (SOLFEGENAMES.indexOf(pitch) !== -1) {
        pitch = FIXEDSOLFEGE[pitch];
    }

    if (pitch in BTOFLAT) {
        pitch = BTOFLAT[pitch];
        var ii = scale.indexOf(pitch);
    } else if (pitch in STOSHARP) {
        pitch = STOSHARP[pitch];
        var ii = scale.indexOf(pitch);
    } else if (scale.indexOf(pitch) !== -1) {
        var ii = scale.indexOf(pitch);
    } else {  // if (PITCHES.indexOf(pitch) !== -1 || PITCHES1.indexOf(pitch) !== -1 || PITCHES2.indexOf(pitch) !== -1 || PITCHES3.indexOf(pitch) !== -1) {
        var ii = scale.indexOf(pitch);
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

        if (ii === -1) {
            // Pitch is not in the consonant scale of this key, so we need to
            // shift up or down for a close match, step up or down, and then
            // compensate for the shift.
            var i = PITCHES.indexOf(pitch);
            if (i !== -1) {
                while (scale.indexOf(pitch) === -1) {
                    var i = PITCHES.indexOf(pitch);
                    if (interval > 0) {
                        i += 1;
                        pitch = PITCHES[i % 12];
                        offset -= 1;
                    } else {
                        i -= 1;
                        if (i < 0) {
                            i += 12;
                        }
                        pitch = PITCHES[i];
                        offset += 1;
                    }
                }

                ii = scale.indexOf(pitch);
            } else {
                var i = PITCHES2.indexOf(pitch);
                if (i !== -1) {
                    while (scale.indexOf(pitch) === -1) {
                        var i = PITCHES2.indexOf(pitch);
                        if (interval > 0) {
                            i += 1;
                            pitch = PITCHES2[i % 12];
                            offset -= 1;
                        } else {
                            i -= 1;
                            if (i < 0) {
                                i += 12;
                            }
                            pitch = PITCHES2[i];
                            offset += 1;
                        }
                    }

                    ii = scale.indexOf(pitch);
                } else {
                    // Should never happen.
                    console.log(pitch + ' not found');
                    return 0;
                }
            }
        }
    }

    // What do we do with the offset? Is it ignored? Or does it count
    // as one step in the interval?

    if (interval === 0) {
        return 0;
    } else if (interval > 0) {
        var j = 0;
        for (var i = 0; i < interval; i++) {
            j += halfSteps[(ii + i) % halfSteps.length];
        }
        return j;
    } else {
        var j = 0;
        for (var i = 0; i > interval; i--) {
            var z = (ii + i - 1) % halfSteps.length;
            while (z < 0) {
                z += halfSteps.length;
            }
            j -= halfSteps[z];
        }
        return j;
    }
};


function calcNoteValueToDisplay(a, b) {
    var noteValue = a / b;
    var noteValueToDisplay = null;

    if (NOTESYMBOLS != undefined && noteValue in NOTESYMBOLS) {
        noteValueToDisplay = '1<br>&mdash;<br>' + noteValue.toString() + '<br>' + '<img src="' + NOTESYMBOLS[noteValue] + '" height=' + (MATRIXBUTTONHEIGHT / 2) + '>';
    } else {
        noteValueToDisplay = reducedFraction(b, a);
    }

    if (parseInt(noteValue) < noteValue) {
        noteValueToDisplay = parseInt((noteValue * 1.5))
        if (NOTESYMBOLS != undefined && noteValueToDisplay in NOTESYMBOLS) {
            noteValueToDisplay = '1.5<br>&mdash;<br>' + noteValueToDisplay.toString() + '<br>' + '<img src="' + NOTESYMBOLS[noteValueToDisplay] + '" height=' + (MATRIXBUTTONHEIGHT / 2) * this.cellScale + '> .';
        } else {
            noteValueToDisplay = parseInt((noteValue * 1.75))
            if (NOTESYMBOLS != undefined && noteValueToDisplay in NOTESYMBOLS) {
                noteValueToDisplay = '1.75<br>&mdash;<br>' + noteValueToDisplay.toString() + '<br>' + '<img src="' + NOTESYMBOLS[noteValueToDisplay] + '" height=' + (MATRIXBUTTONHEIGHT / 2) * this.cellScale + '> ..';
            } else {
                noteValueToDisplay = reducedFraction(b, a);
            }
        }
    }
    return noteValueToDisplay;
};


function durationToNoteValue(duration) {
    // returns [note value, no. of dots, tuplet factor]

    // Try to find a match or a dotted match.
    for (var dotCount = 0; dotCount < 3; dotCount++) {
        var currentDotFactor = 2 - (1 / Math.pow(2, dotCount));
        var d = duration * currentDotFactor;
        if (POWER2.indexOf(d) !== -1) {
            return [d, dotCount, null];
        }
    }

    // First, round down.
    var roundDown = duration;
    for (var i = 1; i < POWER2.length; i++) {
        // Rounding down
        if (roundDown < POWER2[i]) {
            roundDown = POWER2[i - 1];
            break;
        }
    }

    if (POWER2.indexOf(roundDown) === -1) {
        roundDown = 128;
   }

    // Next, see if the note has a factor of 2.
    var factorOfTwo = 1;
    var tupletValue = duration;
    while (Math.floor(tupletValue / 2) * 2 === tupletValue) {
        factorOfTwo *= 2;
        tupletValue /= 2;
    }

    if (factorOfTwo > 1) {
        // We have a tuplet of sorts
        return [duration, 0, tupletValue, roundDown];
    }

    // Next, generate a fauve tuplet for a singleton.
    return [1, 0, duration, roundDown];
};


function toFraction(d) {
    // Convert float to its approximate fractional representation.
    if (d > 1) {
        var flip = true;
        d = 1 / d;
    } else {
        var flip = false;
    }

    var df = 1.0;
    var top = 1;
    var bot = 1;

    while (Math.abs(df - d) > 0.00000001) {
        if (df < d) {
            top += 1
        } else {
            bot += 1
            top = parseInt(d * bot);
        }
        df = top / bot;
    }

    if (flip) {
        var tmp = top;
        top = bot;
        bot = tmp;
    }

    return([top, bot]);
};


function frequencyToPitch(hz) {
    // Calculate the pitch and octave based on frequency, rounding to
    // the nearest cent.

    if (hz < A0) {
        return ['A', 0];
    } else if (hz > C8) {
        // FIXME: set upper bound of C10
        return ['C', 8];
    }

    // Calculate cents to keep track of drift
    var cents = 0;
    for (var i = 0; i < 8800; i++) {
        var f = A0 * Math.pow(TWELVEHUNDRETHROOT2, i);
        if (hz < f * 1.0003 && hz > f * 0.9997) {
            var cents = i % 100;
            var j = Math.floor(i / 100);
            return [PITCHES[(j + PITCHES.indexOf('A')) % 12], Math.floor((j + PITCHES.indexOf('A')) / 12), cents];
        }
    }

    console.log('Could not find note/octave/cents for ' + hz);
    return ['?', -1, 0];
};


function numberToPitch(i) {
    // Calculate the pitch and octave based on index.
    // We start at A0.
    if (i < 0) {
        var n = 0;
        while (i < 0) {
            i += 12;
            n += 1;  // Count octave bump ups.
        }

        return [PITCHES[(i + PITCHES.indexOf('A')) % 12], Math.floor((i + PITCHES.indexOf('A')) / 12) - n];
    } else {
        return [PITCHES[(i + PITCHES.indexOf('A')) % 12], Math.floor((i + PITCHES.indexOf('A')) / 12)];
    }
};

function noteToPitchOctave(note) {
    var len = note.length;
    var octave = last(note);
    var pitch = note.substring(0, len - 1);

    return [pitch, Number(octave)];
};


function noteToFrequency(note, keySignature) {
    var obj = noteToPitchOctave(note);

    return pitchToFrequency(obj[0], obj[1], 0, keySignature);
};


function pitchToFrequency(pitch, octave, cents, keySignature) {
    // Calculate the frequency based on pitch and octave.
    var pitchNumber = pitchToNumber(pitch, octave, keySignature);

    if (cents === 0) {
        return A0 * Math.pow(TWELTHROOT2, pitchNumber);
    } else {
        return A0 * Math.pow(TWELVEHUNDRETHROOT2, pitchNumber * 100 + cents);
    }
};


function pitchToNumber(pitch, octave, keySignature) {
    // Calculate the pitch index based on pitch and octave.
    if (pitch.toUpperCase() === 'R') {
        return 0;
    }

    // Check for flat, sharp, double flat, or double sharp.
    var transposition = 0;
    var len = pitch.length;
    if (len > 1) {
        if (len > 2) {
            var lastTwo = pitch.slice(len - 2);
            if (lastTwo === 'bb' || lastTwo === '♭♭') {
                pitch = pitch.slice(0, len - 2);
                transposition -= 2;
            } else if (lastTwo === '##' || lastTwo === '♯♯') {
                pitch = pitch.slice(0, len - 2);
                transposition += 2;
            } else if (lastTwo === '#b' || lastTwo === '♯♭' || lastTwo === 'b#' || lastTwo === '♭♯') {
                // Not sure this could occur... but just in case.
                pitch = pitch.slice(0, len - 2);
            }
        }

        if (pitch.length > 1) {
            var lastOne = pitch.slice(len - 1);
            if (lastOne === 'b' || lastOne === '♭') {
                pitch = pitch.slice(0, len - 1);
                transposition -= 1;
            } else if (lastOne === '#' || lastOne === '♯') {
                pitch = pitch.slice(0, len - 1);
                transposition += 1;
            }
        }
    }

    var pitchNumber = 0;
    if (PITCHES.indexOf(pitch) !== -1) {
        pitchNumber = PITCHES.indexOf(pitch.toUpperCase());
    } else {
        // obj[1] is the solfege mapping for the current key/mode
        var obj = getScaleAndHalfSteps(keySignature)
        if (obj[1].indexOf(pitch.toLowerCase()) !== -1) {
            pitchNumber = obj[1].indexOf(pitch.toLowerCase());
        } else {
            console.log('pitch ' + pitch + ' not found.');
            pitchNumber = 0;
        }
    }

    // We start at A0.
    return octave * 12 + pitchNumber - PITCHES.indexOf('A') + transposition;
};


function noteIsSolfege(note) {
    if (SOLFEGECONVERSIONTABLE[note] == undefined) {
        return true;
    } else {
        return false;
    }
};


function getSolfege(note) {
    // FIXME: Use mode-specific conversion.
    if (noteIsSolfege(note)) {
        return note;
    } else {
        return SOLFEGECONVERSIONTABLE[note];
    }
};


function i18nSolfege(note) {
    // solfnotes_ is used in the interface for i18n
    //.TRANS: the note names must be separated by single spaces
    var solfnotes_ = _('ti la sol fa mi re do').split(' ');
    var obj = splitSolfege(note);

    var i = SOLFNOTES.indexOf(obj[0]);
    if (i !== -1) {
        return solfnotes_[i] + obj[1];
    } else {
        console.log(note + ' not found.');
        return note;
    }
};


function splitSolfege(value) {
    // Separate the pitch from any attributes, e.g., # or b
    if (value != null) {
        if (SOLFNOTES.indexOf(value) !== -1) {
            var note = value;
            var attr = '';
        } else if (value.slice(0, 3) === 'sol') {
            var note = 'sol';
            if (value.length === 4) {
                var attr = value[3];
            } else {
                var attr = value[3] + value[3];
            }
        } else {
            var note = value.slice(0, 2);
            if (value.length === 3) {
                var attr = value[2];
            } else {
                var attr = value[2] + value[2];
            }
        }
    } else {
        var note = 'sol';
        var attr = ''
    }

    return [note, attr];
};


function getNumber(notename, octave) {
    // Converts a note, e.g., C, and octave to a number
    if (octave < 0) {
        var num = 0;
    } else if (octave > 10) {
        var num = 9 * 12;
    } else {
        var num = 12 * (octave - 1);
    }

    notename = String(notename);
    if (notename.substring(0, 1) in NOTESTEP) {
        num += NOTESTEP[notename.substring(0, 1)];
        if (notename.length >= 1) {
            var delta = notename.substring(1);
            if (delta === 'bb' || delta === '♭♭') {
                num -= 2;
            } else if (delta === '##' || delta === '♯♯') {
                num += 2;
            } else if (delta === 'b' || delta === '♭') {
                num -= 1;
            } else if (delta === '#' || delta === '♯') {
                num += 1;
            }
        }
    }
    return num;
};


function getNumNote(value, delta) {
    // Converts from number to note
    var num = value + delta;
    /*
    if (num < 0) {
        num = 1;
        var octave = 1;
    } else if (num > 10 * 12) {
        num = 12;
        var octave = 10;
    } else {
        var octave = Math.floor(num / 12);
        num = num % 12;
    }
    */
    var octave = Math.floor(num / 12);
    num = num % 12;

    var note = NOTESTABLE[num];

    if (note[num] === 'ti') {
        octave -= 1;
    }

    return [note, octave + 1];
};


calcOctave = function (current, arg) {
    switch(arg) {
    case _('next'):
    case 'next':
        return Math.min(current + 1, 10);
    case _('previous'):
    case 'previous':
        return Math.max(current - 1, 1);
    case _('current'):
    case 'current':
        return current;
    default:
        return Math.floor(arg);
    }
};


calcOctaveInterval = function (arg) {
    // Used by intervals to determine octave to use in an interval.
    var value = 0;
    switch(arg) {
    case 1:
    case _('next'):
    case 'next':
        value = 1;
        break;
    case -1:
    case _('previous'):
    case 'previous':
        value = -1;
        break;
    case _('current'):
    case 'current':
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
        console.log('Interval octave must be between -2 and 2.');
        value = 0;
        break;
    }

    return value;
};


function isInt(value) {
    return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
};


function reducedFraction(a, b) {
    greatestCommonMultiple = function (a, b) {
        return b === 0 ? a : greatestCommonMultiple(b, a % b);
    }

    var gcm = greatestCommonMultiple(a, b);
    if (NOTESYMBOLS != undefined && [1, 2, 4, 8, 16, 32, 64].indexOf(b/gcm) !== -1) {
        return (a / gcm) + '<br>&mdash;<br>' + (b / gcm) + '<br><img src=' + NOTESYMBOLS[b / gcm] + '>';
    } else {
        return (a / gcm) + '<br>&mdash;<br>' + (b / gcm) + '<br><br>';
    }
};


// Validate the passed on parameters in a function as per the default
// parameters values
function validateAndSetParams(defaultParams, params) {
    if (defaultParams && (defaultParams !== null) && params && (params !== undefined)) {
        for (var key in defaultParams) {
            if (key in params && params[key] !== undefined)
                defaultParams[key] = params[key];
        }
    }

    return defaultParams;
};

// This object contains mapping between instrument name and
// corresponding synth object.  The instrument name is the one that
// the user sets in the "Timbre" clamp and uses in the "Set Timbre"
// clamp

var instruments = {};

// This object contains mapping between instrument name and its source
// - (0->default, 1->drum, 2->voice, 3->builtin)
// e.g. instrumentsSource['kick drum'] = [1, 'kick drum']

var instrumentsSource = {};

// Effects associated with instruments in the timbre widget

var instrumentsEffects = {};

// Filters associated with instruments in the timbre widget

var instrumentsFilters = {};


function Synth() {
    // Isolate synth functions here.

    const VOICE_SAMPLES = {
        'violin': VIOLINSOUNDSAMPLE,
        'cello': CELLOSOUNDSAMPLE,
        'flute': FLUTESOUNDSAMPLE,
        'guitar': GUITARSOUNDSAMPLE,
        'basse': BASSESOUNDSAMPLE
    };

    const BUILTIN_SYNTHS = {
        'sine': 1,
        'triangle': 1,
        'sawtooth': 1,
        'square': 1,
        'pluck': 1,
        'noise1': 1,
        'noise2': 1,
        'noise3': 1,
        'poly': 1,
        'mono1': 1,
        'mono2': 1,
        'mono3': 1,
        'mono4': 1,
        'custom': 1,
    };

    const CUSTOM_SYNTHS = {
        'amsynth': 1,
        'fmsynth': 1,
        'duosynth': 1,
    };

    // Using Tone.js
    this.tone = new Tone();

    Tone.Buffer.onload = function () {
        console.log('sample loaded');
    };

    this.recorder = new Recorder(Tone.Master);

    this.download = function (blob){
        var filename = prompt('Filename:', 'untitled.wav');
        if (fileExt(filename) !== 'wav') {
            filename += '.wav';
        }
        download(filename, URL.createObjectURL(blob));
    }

    // Function that provides default parameters for various synths
    this.getDefaultParamValues = function (sourceName) {
        // sourceName may need to be 'untranslated'
        var sourceNameLC = sourceName.toLowerCase();
        if (getOscillatorTypes(sourceNameLC) != null) {
            sourceNameLC = getOscillatorTypes(sourceNameLC);
        }

        switch(sourceNameLC) {
        case 'amsynth':
            var synthOptions = {
                'harmonicity': 3,
                'detune': 0,
                'envelope': {
                    'attack': 0.01,
                    'decay': 0.01,
                    'sustain': 1,
                    'release': 0.5
                },
                'modulation': {
                    'type': 'square'
                },
                'modulationEnvelope': {
                    'attack': 0.5,
                    'decay': 0,
                    'sustain': 1,
                    'release': 0.5
                }
            };
            break;
        case'fmsynth':
            var synthOptions = {
                'harmonicity': 3,
                'modulationIndex': 10,
                'detune': 0,
                'envelope': {
                    'attack': 0.01,
                    'decay': 0.01,
                    'sustain': 1,
                    'release': 0.5
                },
                'modulation': {
                    'type': 'square'
                },
                'modulationEnvelope': {
                    'attack': 0.5,
                    'decay': 0.0,
                    'sustain': 1,
                    'release': 0.5
                }
            };
            break;
        case 'noise1':
            var synthOptions = {
                'noise': {
                    'type': 'white'
                },
                'envelope': {
                    'attack': 0.005 ,
                    'decay': 0.1 ,
                    'sustain': 1
                }
            };
            break;
        case 'noise2':
            var synthOptions = {
                'noise': {
                    'type': 'brown'
                },
                'envelope': {
                    'attack': 0.005 ,
                    'decay': 0.1 ,
                    'sustain': 1
                }
            };
            break;
        case 'noise3':
            var synthOptions = {
                'noise': {
                    'type': 'pink'
                },
                'envelope': {
                    'attack': 0.005 ,
                    'decay': 0.1 ,
                    'sustain': 1
                }
            };
            break;
        case 'mono1':
        case 'mono2':
        case 'mono3':
        case 'mono4':
            var synthOptions = {
                'oscillator': {
                    'type': 'sine'
                },
                'envelope': {
                    'attack': 0.03,
                    'decay': 0,
                    'sustain': 1,
                    'release': 0.03
                },
            };
            break;
        case 'duosynth':
            var synthOptions = {
                'vibratoAmount': 0.5,
                'vibratoRate': 5,
                'harmonicity': 1.5,
                'voice0': {
                    'volume': -10,
                    'portamento': 0,
                    'oscillator': {
                        'type': 'sine'
                    },
                    'filterEnvelope': {
                        'attack': 0.01,
                        'decay': 0.0,
                        'sustain': 1,
                        'release': 0.5
                    },
                    'envelope': {
                        'attack': 0.01,
                        'decay': 0.0,
                        'sustain': 1,
                        'release': 0.5
                    }
                },
                'voice1': {
                    'volume': -10,
                    'portamento': 0,
                    'oscillator': {
                        'type': 'sine'
                    },
                    'filterEnvelope': {
                        'attack': 0.01,
                        'decay': 0.0,
                        'sustain': 1,
                        'release': 0.5
                    },
                    'envelope': {
                        'attack': 0.01,
                        'decay': 0.0,
                        'sustain': 1,
                        'release': 0.5
                    }
                }
            };
            break;
        case 'sine':
        case 'triangle':
        case 'square':
        case 'sawtooth':
            var synthOptions = {
                'oscillator': {
                    'type': sourceNameLC
                },
                'envelope': {
                    'attack': 0.03,
                    'decay': 0,
                    'sustain': 1,
                    'release': 0.03
                },
            };
            break;
        case 'pluck':
             var synthOptions = {
                'attackNoise': 1,
                'dampening': 4000,
                'resonance': 0.9
            };
            break;
        case 'poly':
            var synthOptions = {
                polyphony: 6
            };
            break;
        default:
            var synthOptions = {};
            break;
        }

        return synthOptions;
    };

    // Poly synth will be loaded as the default synth.
    this.createDefaultSynth = function () {
        console.log('poly (default) (custom)');
        var default_synth = new Tone.PolySynth(6, Tone.AMSynth).toMaster();
        instruments['default'] = default_synth;
        instrumentsSource['default'] = [0, 'default'];
        instruments['custom'] = default_synth;
        instrumentsSource['custom'] = [0, 'custom'];
    };

    // Function reponsible for creating the synth using the existing
    // samples: drums and voices
    this._createSampleSynth = function (instrumentName, sourceName, params) {
        if (sourceName in VOICE_SAMPLES) {
            instrumentsSource[instrumentName] = [2, sourceName];
            console.log(sourceName);
            var tempSynth = new Tone.Sampler(VOICE_SAMPLES[sourceName]);
        }
        else if (sourceName in DRUM_SAMPLES) {
            instrumentsSource[instrumentName] = [1, sourceName];
            console.log(sourceName);
            var tempSynth = new Tone.Sampler(DRUM_SAMPLES[sourceName]);
        }
        else {
            // default drum sample
            instrumentsSource[instrumentName] = [1, 'drum'];
            console.log(DEFAULTDRUM);
            var tempSynth = new Tone.Sampler(DRUM_SAMPLES[DEFAULTDRUM]);
        }

        return tempSynth;
    };

    // Function using builtin synths from Tone.js
    this._createBuiltinSynth = function (instrumentName, sourceName, params) {
        if (sourceName in BUILTIN_SYNTHS) {
            var synthOptions = this.getDefaultParamValues(sourceName);
            synthOptions = validateAndSetParams(synthOptions, params);
        }

        switch (sourceName) {
        case 'mono1':
        case 'mono2':
        case 'mono3':
        case 'mono4':
            instrumentsSource[instrumentName] = [3, sourceName];
            console.log(sourceName);
            var builtin_synth = new Tone.Synth(synthOptions);
            break;
        case 'sine':
        case 'triangle':
        case 'square':
        case 'sawtooth':
            instrumentsSource[instrumentName] = [3, sourceName];
            console.log(sourceName);
            var builtin_synth = new Tone.Synth(synthOptions);
            break;
        case 'pluck':
            instrumentsSource[instrumentName] = [3, sourceName];
            console.log(sourceName);
            var builtin_synth = new Tone.PluckSynth(synthOptions);
            break;
        case 'poly':
            instrumentsSource[instrumentName] = [0, 'poly'];
            console.log('poly');
            var builtin_synth = new Tone.PolySynth(synthOptions.polyphony, Tone.AMSynth);
            break;
        case 'noise1':
        case 'noise2':
        case 'noise3':
            instrumentsSource[instrumentName] = [4, sourceName];
            console.log(sourceName);
            var builtin_synth = new Tone.NoiseSynth(synthOptions);
            break;
        default:
            instrumentsSource[instrumentName] = [0, 'poly'];
            console.log('poly (default)');
            var builtin_synth = new Tone.PolySynth(6, Tone.AMSynth);
            break;
        }

        return builtin_synth;
    };


    // Function reponsible for creating the custom synth using the
    // Tonejs methods like AMSynth, FMSynth, etc.
    this._createCustomSynth = function (sourceName, params) {
        // Getting parameters for custom synth
        var synthOptions = this.getDefaultParamValues(sourceName);
        synthOptions = validateAndSetParams(synthOptions, params);

        if (sourceName.toLowerCase() === 'amsynth') {
            var tempSynth = new Tone.AMSynth(synthOptions);
        } else if (sourceName.toLowerCase() === 'fmsynth') {
            var tempSynth = new Tone.FMSynth(synthOptions);
        } else if (sourceName.toLowerCase() === 'duosynth') {
            var tempSynth = new Tone.DuoSynth(synthOptions);
        } else {
            var tempSynth = new Tone.PolySynth(6, Tone.AMSynth);
        }

        return tempSynth;
    };

    // Create the synth as per the user's input in the 'Timbre' clamp.
    this.createSynth = function (instrumentName, sourceName, params) {
        if ((sourceName in VOICE_SAMPLES) || (sourceName in DRUM_SAMPLES)) {
            instruments[instrumentName] = this._createSampleSynth(instrumentName, sourceName, null).toMaster();
        } else if (sourceName in BUILTIN_SYNTHS) {
            instruments[instrumentName] = this._createBuiltinSynth(instrumentName, sourceName, params).toMaster();
        } else if (sourceName in CUSTOM_SYNTHS) {
            instruments[instrumentName] = this._createCustomSynth(sourceName, params).toMaster();
            instrumentsSource[instrumentName] = [0, 'poly'];
        } else {
            if (sourceName.length >= 4) {
                if (sourceName.slice(0, 4) === 'http') {
                    instruments[sourceName] = new Tone.Sampler(sourceName).toMaster();
                    instrumentsSource[instrumentName] = [1, 'drum'];
                } else if (sourceName.slice(0, 4) === 'file') {
                    instruments[sourceName] = new Tone.Sampler(sourceName).toMaster();
                    instrumentsSource[instrumentName] = [1, 'drum'];
                } else if (sourceName === 'drum') {
                    instruments[sourceName] = this._createSampleSynth(sourceName, sourceName, null).toMaster();
                    instrumentsSource[instrumentName] = [1, 'drum'];
                }
            }
        }
    };

    this.loadSynth = function (sourceName) {
        if (instruments[sourceName] == null) {
            console.log('loading ' + sourceName);
            this.createSynth(sourceName, sourceName, null);
        }

        if (sourceName in instruments) {
            return instruments[sourceName].toMaster();
        }

        return null;
    }

    this.performNotes = function (synth, notes, beatValue, paramsEffects, paramsFilters) {
        if (paramsEffects == null && paramsFilters == null) {
            synth.triggerAttackRelease(notes, beatValue);
        } else {
            if (paramsFilters != null && paramsFilters != undefined) {
                var numFilters = paramsFilters.length;  // no. of filters
                var k = 0;
                var temp_filters = [];

                for (k = 0; k < numFilters; k++) {
                    // filter rolloff has to be added
                    var filterVal = new Tone.Filter(paramsFilters[k].filterFrequency, paramsFilters[k].filterType, paramsFilters[k].filterRolloff);
                    temp_filters.push(filterVal);
                    synth.chain(temp_filters[k], Tone.Master);
                }
            }

            if (paramsEffects != null && paramsEffects != undefined) {
                if (paramsEffects.doVibrato) {
                    var vibrato = new Tone.Vibrato(1 / paramsEffects.vibratoFrequency, paramsEffects.vibratoIntensity);
                    synth.chain(vibrato, Tone.Master);
                }

                if (paramsEffects.doDistortion) {
                    var distort = new Tone.Distortion(paramsEffects.distortionAmount).toMaster();
                    synth.connect(distort, Tone.Master);
                }

                if (paramsEffects.doTremolo) {
                    var tremolo = new Tone.Tremolo({
                        'frequency': paramsEffects.tremoloFrequency,
                        'depth': paramsEffects.tremoloDepth
                    }).toMaster().start();
                    synth.chain(tremolo);
                }

                if (paramsEffects.doPhaser) {
                    var phaser = new Tone.Phaser({
                        'frequency': paramsEffects.rate,
                        'octaves': paramsEffects.octaves,
                        'baseFrequency': paramsEffects.baseFrequency
                    }).toMaster();
                    synth.chain(phaser, Tone.Master);
                }

                if (paramsEffects.doChorus) {
                    var chorusEffect = new Tone.Chorus({
                        'frequency': paramsEffects.chorusRate,
                        'delayTime': paramsEffects.delayTime,
                        'depth': paramsEffects.chorusDepth
                    }).toMaster();
                    synth.chain(chorusEffect, Tone.Master);
                }
            }

            synth.triggerAttackRelease(notes, beatValue);

            setTimeout(function () {
                if (paramsEffects && paramsEffects != null && paramsEffects != undefined) {
                    if (paramsEffects.doVibrato) {
                        vibrato.dispose();
                    }

                    if (paramsEffects.doDistortion) {
                        distort.dispose();
                    }

                    if (paramsEffects.doTremolo) {
                        tremolo.dispose();
                    }

                    if (paramsEffects.doPhaser) {
                        phaser.dispose();
                    }

                    if (paramsEffects.doChorus) {
                        chorusEffect.dispose();
                    }
                }

                if (paramsFilters && paramsFilters != null && paramsFilters != undefined) {
                    for (k = 0; k < numFilters; k++) {
                        temp_filters[k].dispose();
                    }
                }
            }, beatValue * 1000);
        }
    };

    // Generalised version of 'trigger and 'triggerwitheffects' functions
    this.trigger = function (notes, beatValue, instrumentName, paramsEffects, paramsFilters) {
        if (paramsEffects !== null && paramsEffects !== undefined) {
            if (paramsEffects['vibratoIntensity'] != 0) {
                paramsEffects.doVibrato = true;
            }

            if (paramsEffects['distortionAmount'] != 0) {
                paramsEffects.doDistortion = true;
            }

            if (paramsEffects['tremoloFrequency'] != 0) {
                paramsEffects.doTremolo = true;
            }

            if (paramsEffects['rate'] != 0) {
                paramsEffects.doPhaser = true;
            }

            if (paramsEffects['chorusRate'] != 0) {
                paramsEffects.doChorus = true;
            }
        }

        var tempNotes = notes;
        var tempSynth = instruments['default'];
        var flag = 0;
        if (instrumentName in instruments) {
            tempSynth = instruments[instrumentName];
            flag = instrumentsSource[instrumentName][0];
            if (flag === 1 || flag === 2) {
                var sampleName = instrumentsSource[instrumentName][1];
            }
        }

        // Get note values as per the source of the synth.
        switch(flag) {
        case 1:  // drum
            if (instrumentName.slice(0, 4) === 'http') {
                tempSynth.triggerAttack(0, beatValue);
            } else if (instrumentName.slice(0, 4) === 'file') {
                tempSynth.triggerAttack(0, beatValue);
            } else {
                tempSynth.triggerAttack(0);
            }
            break;
        case 2:  // voice sample
            var centerNo = SAMPLECENTERNO[sampleName];
            var obj = noteToPitchOctave(notes);
            var noteNum = pitchToNumber(obj[0], obj[1], 'C Major');
            tempNotes = noteNum - centerNo;
            this.performNotes(tempSynth.toMaster(), tempNotes, beatValue, paramsEffects, paramsFilters);
            break;
        case 3:  // builtin synth
            if (typeof(notes) === 'object') {
                tempNotes = notes[0];
            }

            this.performNotes(tempSynth.toMaster(), tempNotes, beatValue, paramsEffects, paramsFilters);
            break;
        case 4:
            tempSynth.triggerAttackRelease(beatValue);
            break;
        case 0:  // default synth
        default:
            this.performNotes(tempSynth.toMaster(), tempNotes, beatValue, paramsEffects, paramsFilters);
            break;
        }
    };

    this.stopSound = function (instrumentName) {
        instruments[instrumentName].triggerRelease();
    };

    this.start = function () {
        Tone.Transport.start();
    };

    this.stop = function () {
        Tone.Transport.stop();
    };

    this.setVolume = function (instrumentName, volume) {
        // volume in decibals
        var db = this.tone.gainToDb(volume / 100);
        if (instrumentName in instruments) {
            instruments[instrumentName].volume.value = db;
        }
    };

    this.getVolume = function (instrumentName) {
        // volume in decibals
        if (instrumentName in instruments) {
            return instruments[instrumentName].volume.value;
        } else {
            console.log('instrument not found');
            return 50;
        }
    };

    this.setMasterVolume = function (volume) {
        var db = this.tone.gainToDb(volume / 100);
        Tone.Master.volume.rampTo(db, 0.01);
    };

};
