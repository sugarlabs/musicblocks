// Copyright (c) 2016 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const SHARP = '♯';
const FLAT = '♭';
const BTOFLAT = {'Eb': 'E♭', 'Gb': 'G♭', 'Ab': 'A♭', 'Bb': 'B♭', 'Db': 'D♭', 'Cb': 'B', 'Fb': 'E', 'eb': 'E♭', 'gb': 'G♭', 'ab': 'A♭', 'bb': 'B♭', 'db': 'D♭', 'cb': 'B', 'fb': 'E'};
const STOSHARP = {'E#': 'F', 'G#': 'G♯', 'A#': 'A♯', 'B#': 'C', 'D#': 'D♯', 'C#': 'C♯', 'F#': 'F♯', 'e#': 'F', 'g#': 'G♯', 'a#': 'A♯', 'b#': 'C', 'd#': 'D♯', 'c#': 'C♯', 'f#': 'F♯'};
const NOTESSHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const NOTESFLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const NOTESFLAT2 = ['c', 'd♭', 'd', 'e♭', 'e', 'f', 'g♭', 'g', 'a♭', 'a', 'b♭', 'b'];
const EQUIVALENTNOTES = {'C♯': 'D♭', 'D♯': 'E♭', 'F♯': 'G♭', 'G♯': 'A♭', 'A♯': 'B♭', 'D♭': 'C♯', 'E♭': 'D♯', 'G♭': 'F♯', 'A♭': 'G♯', 'B♭': 'A♯'};
const EXTRATRANSPOSITIONS = {'E♯': ['F', 0], 'B♯': ['C', 1], 'C♭': ['B', -1], 'F♭': ['E', 0], 'e♯': ['F', 0], 'b♯': ['C', 1], 'c♭': ['B', -1], 'f♭': ['E', 0]};
const SOLFEGENAMES = ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'];
const SOLFEGECONVERSIONTABLE = {'C': 'do', 'C♯': 'do' + '♯', 'D': 're', 'D♯': 're' + '♯', 'E': 'mi', 'F': 'fa', 'F♯': 'fa' + '♯', 'G': 'sol', 'G♯': 'sol' + '♯', 'A': 'la', 'A♯': 'la' + '♯', 'B': 'ti', 'D♭': 're' + '♭', 'E♭': 'mi' + '♭', 'G♭': 'sol' + '♭', 'A♭': 'la' + '♭', 'B♭': 'ti' + '♭', 'R': _('rest')};
const PITCHES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const PITCHES1 = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const PITCHES2 = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const PITCHES3 = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTESTABLE = {1: "do", 2: "do♯", 3: "re", 4: "re♯", 5: "mi", 6: "fa", 7: "fa♯", 8: "sol", 9: "sol♯", 10: "la", 11: "la♯", 0: "ti"};
const NOTESTEP = {'C': 1, 'D': 3, 'E': 5, 'F': 6, 'G': 8, 'A': 10, 'B': 12};

const SEMITONES = 12;
const POWER2 = [1, 2, 4, 8, 16, 32, 64, 128];
const TWELTHROOT2 = 1.0594630943592953;
const TWELVEHUNDRETHROOT2 = 1.0005777895065549;
const A0 = 27.5;
const C8 = 4186.01;

const RHYTHMRULERHEIGHT = 100;


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

// The table contains the intervals that define the modes.
// All of these modes assume 12 semitones per octave.
// See http://www.pianoscales.org
const MUSICALMODES = {
     // 12 notes in an octave
    'CHROMATIC': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],

     // 8 notes in an octave
    'ALGERIAN': [2, 1, 2, 1, 1, 1, 3, 1],
    'DIMINISHED': [2, 1, 2, 1, 2, 1, 2, 1],
    'SPANISH': [1, 2, 1, 1, 1, 2, 2, 2],
    'OCATONIC': [1, 2, 1, 2, 1, 2, 1, 2],

     // 7 notes in an octave
    'MAJOR': [2, 2, 1, 2, 2, 2, 1],
    'IONIAN': [2, 2, 1, 2, 2, 2, 1],
    'DORIAN': [2, 1, 2, 2, 2, 1, 2],
    'PHRYGIAN': [1, 2, 2, 2, 1, 2, 2],
    'LYDIAN': [2, 2, 2, 1, 2, 2, 1],
    'MIXOLYDIAN': [2, 2, 1, 2, 2, 1, 2],
    'MINOR': [2, 1, 2, 2, 1, 2, 2],
    'AEOLIAN': [2, 1, 2, 2, 1, 2, 2],
    'LOCRIAN': [1, 2, 2, 1, 2, 2, 2],

    'JAZZ MINOR': [2, 1, 2, 2, 2, 2, 1],
    'BEBOP': [1, 1, 1, 2, 2, 1, 2],

    'ARABIC': [2, 2, 1, 1, 2, 2, 2],
    'BYZANTINE': [1, 3, 1, 2, 1, 3, 1],
    'ENIGMATIC': [1, 3, 2, 2, 2, 1, 1],
    'ETHIOPIAN': [2, 1, 2, 2, 1, 2, 2],
    'GEEZ': [2, 1, 2, 2, 1, 2, 2],
    'HINDU': [2, 2, 1, 2, 1, 2, 2],
    'HUNGARIAN': [2, 1, 3, 1, 1, 3, 1],
    'ROMANIAN MINOR': [2, 1, 3, 1, 2, 1, 2],
    'SPANISH GYPSY': [1, 3, 1, 2, 1, 2, 2],
    'MAQAM': [1, 3, 1, 2, 1, 3, 1],

    // 6 notes in an octave
    'BLUES': [3, 2, 1, 1, 3, 2],
    'MAJOR BLUES': [2, 1, 1, 3, 2, 2],
    'WHOLE TONE': [2, 2, 2, 2, 2, 2],

    // 5 notes in an octave
    'PENTATONIC': [3, 2, 2, 3, 2],
    'CHINESE': [4, 2, 1, 4, 1],
    'EGYPTIAN': [2, 3, 2, 3, 2],
    'HIRAJOSHI': [1, 4, 1, 4, 2],
    'JAPANESE': [1, 4, 2, 3, 2],
    'FIBONACCI': [1, 1, 2, 3, 5],

    // User definition overrides this constant
    'CUSTOM': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

const MAQAMTABLE = {
    'HIJAZ KAR': 'C MAQAM',
    'HIJAZ KAR MAQAM': 'C MAQAM',
    'SHAHNAZ': 'D MAQAM',
    'MAQAM MUSTAR': 'Eb MAQAM',
    'MAQAM JIHARKAH': 'F MAQAM',
    'SHADD ARABAN': 'G MAQAM',
    'SUZIDIL': 'A MAQAM',
    'AJAM': 'Bb MAQAM',
    'AJAM MAQAM': 'Bb MAQAM',
};

const MODENAMES = [
    //.TRANS: twelve semi-tone scale for music
    [_('Chromatic'), 'CHROMATIC'],
    [_('Algerian'), 'ALGERIAN'],
    //.TRANS: modal scale for music
    [_('Diminished'), 'DIMINISHED'],
    [_('Spanish'), 'SPANISH'],
    //.TRANS: modal scale for music
    [_('Octatonic'), 'OCTATONIC'],
    //.TRANS: major scales in music
    [_('Major'), 'MAJOR'],
    //.TRANS: modal scale for music
    [_('Ionian'), 'IONIAN'],
    //.TRANS: modal scale for music
    [_('Dorian'), 'DORIAN'],
    //.TRANS: modal scale for music
    [_('Phrygian'), 'PHRYGIAN'],
    //.TRANS: modal scale for music
    [_('Lydian'), 'LYDIAN'],
    //.TRANS: modal scale for music
    [_('Mixolydian'), 'MIXOLYDIAN'],
    //.TRANS: natural minor scales in music
    [_('Minor'), 'MINOR'],
    //.TRANS: modal scale for music
    [_('Aeolian'), 'AEOLIAN'],
    //.TRANS: modal scale for music
    [_('Locrian'), 'LOCRIAN'],
    //.TRANS: minor jazz scale for music
    [_('Jazz Minor'), 'JAZZ MINOR'],
    //.TRANS: bebop scale for music
    [_('Bebop'), 'BEBOP'],
    [_('Arabic'), 'ARABIC'],
    [_('Byzantine'), 'BYZANTINE'],
    //.TRANS: musical scale for music by Verdi
    [_('Enigmatic'), 'ENIGMATIC'],
    [_('Ethiopian'), 'ETHIOPIAN'],
    //.TRANS: Ethiopic scale for music
    [_('Geez'), 'GEEZ'],
    [_('Hindu'), 'HINDU'],
    [_('Hungarian'), 'HUNGARIAN'],
    //.TRANS: minor Romanian scale for music
    [_('Romanian Minor'), 'ROMANIAN MINOR'],
    [_('Spanish Gypsy'), 'SPANISH GYPSY'],
    //.TRANS: musical scale for Mid-Eastern music
    [_('Maqam'), 'MAQAM'],
    //.TRANS: minor blues scale for music
    [_('Blues'), 'BLUES'],
    //.TRANS: major blues scale for music
    [_('Major Blues'), 'MAJOR BLUES'],
    [_('Whole Tone'), 'WHOLE TONE'],
    //.TRANS: pentatonic scale in music
    [_('Pentatonic'), 'PENTATONIC'],
    [_('Chinese'), 'CHINESE'],
    [_('Egyptian'), 'EGYPTIAN'],
    //.TRANS: Japanese pentatonic scale for music
    [_('Hirajoshi'), 'HIRAJOSHI'],
    [_('Japanese'), 'JAPANESE'],
    //.TRANS: Italian mathematician
    [_('Fibonacci'), 'FIBONACCI'],
    [_('Custom'), 'CUSTOM'],
];

const DRUMNAMES = [
    //.TRANS: musical instrument
    [_('snare drum'), 'snaredrum', 'images/drum.svg'],
    //.TRANS: musical instrument
    [_('kick drum'), 'kick', 'images/drum.svg'],
    //.TRANS: musical instrument
    [_('tom tom'), 'tom', 'images/tomtom.svg'],
    //.TRANS: musical instrument
    [_('floor tom tom'), 'floortom', 'images/floortom.svg'],
    //.TRANS: musical instrument
    [_('cup drum'), 'cup', 'images/drum.svg'],
    //.TRANS: musical instrument
    [_('darbuka drum'), 'darbuka', 'images/darbuka.svg'],
    //.TRANS: musical instrument
    [_('hi hat'), 'hihat', 'images/hihat.svg'],
    //.TRANS: musical instrument
    [_('ride bell'), 'ridebell', 'images/ridebell.svg'],
    //.TRANS: musical instrument
    [_('cow bell'), 'cowbell', 'images/bell.svg'],
    //.TRANS: musical instrument
    [_('triangle bell'), 'trianglebell', 'images/triangle.svg'],
    //.TRANS: musical instrument
    [_('finger cymbals'), 'fingercymbals', 'images/fingercymbals.svg'],
    //.TRANS: sound effect
    [_('chine'), 'chine', 'images/bell.svg'],
    //.TRANS: sound effect
    [_('clang'), 'clang', 'images/bell.svg'],
    //.TRANS: sound effect
    [_('crash'), 'crash', 'images/bell.svg'],
    //.TRANS: sound effect
    [_('bottle'), 'bottle', 'images/drum.svg'],
    //.TRANS: sound effect
    [_('clap'), 'clap', 'images/drum.svg'],
    //.TRANS: sound effect
    [_('slap'), 'slap', 'images/drum.svg'],
    //.TRANS: sound effect
    [_('splash'), 'splash', 'images/drum.svg'],
    //.TRANS: sound effect
    [_('bubbles'), 'bubbles', 'images/drum.svg'],
    //.TRANS: animal sound effect
    [_('cat'), 'cat', 'images/cat.svg'],
    //.TRANS: animal sound effect
    [_('cricket'), 'cricket', 'images/cricket.svg'],
    //.TRANS: animal sound effect
    [_('dog'), 'dog', 'images/dog.svg'],
    //.TRANS: animal sound effect
    [_('duck'), 'duck', 'images/duck.svg'],
];

const DEFAULTDRUM = 'kick';

var customMode = MUSICALMODES['CUSTOM'];

function getDrumName(name) {
    if (name === '') {
        console.log('getDrumName passed blank name. Returning ' + DEFAULTDRUM);
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) == 'http') {
        // console.log('drum name is URL');
        return null;
    }

    for (var i = 0; i < DRUMNAMES.length; i++) {
        // if (DRUMNAMES[i].indexOf(name) !== -1) {
        if (DRUMNAMES[i][0] === name || DRUMNAMES[i][1] === name) {
            if (DRUMNAMES[i][0] != '') {
                return DRUMNAMES[i][0];
            } else {
                console.log('i18n is misbehaving?');
                return DRUMNAMES[i][1];
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
        // console.log('drum name is URL');
        return 'images/drum.svg';
    }

    for (var i = 0; i < DRUMNAMES.length; i++) {
        // if (DRUMNAMES[i].indexOf(name) !== -1) {
        if (DRUMNAMES[i][0] === name || DRUMNAMES[i][1] === name) {
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
        // console.log('drum name is URL');
        return name;
    }

    for (var i = 0; i < DRUMNAMES.length; i++) {
        // if (DRUMNAMES[i].indexOf(name) !== -1) {
        if (DRUMNAMES[i][0] === name || DRUMNAMES[i][1] === name) {
            return DRUMNAMES[i][1];
        }
    }
    return null;
};


function keySignatureToMode(keySignature) {
    // Convert from "A Minor" to "A" and "MINOR"
    if (keySignature === '') {
        console.log('no key signature provided; reverting to C MAJOR');
       return ['C', 'MAJOR'];
    }

    // Maqams have special names for certain keys.
    if (keySignature.toUpperCase() in MAQAMTABLE) {
        keySignature = MAQAMTABLE[keySignature.toUpperCase()];
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
        console.log('invalid key or missing name; reverting to C.');
        // Is is possible that the key was left out?
        var keySignature = 'C ' + keySignature;
        var parts = keySignature.split(' ');
        key = 'C';
    }

    if (minorMode) {
        return [key, 'MINOR'];
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
        mode = 'MAJOR';
    } else {
        mode = mode.toUpperCase();
    }

    if (mode in MUSICALMODES) {
        return [key, mode];
    } else {
        console.log('invalid mode name: ' + mode + ' reverting to MAJOR');
        return [key, 'MAJOR'];
    }
};


function getStepSizeUp(keySignature, pitch) {
    return _getStepSize(keySignature, pitch, 'up');
};


function getStepSizeDown(keySignature, pitch) {
    return _getStepSize(keySignature, pitch, 'down');
};


function _getStepSize(keySignature, pitch, direction) {
    // Returns how many half-steps to the next note in this key.
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

    if (pitch in BTOFLAT) {
        pitch = BTOFLAT[pitch];
    } else if (pitch in STOSHARP) {
        pitch = STOSHARP[pitch];
    }

    var scale = [myKeySignature];
    var ii = idx;
    for (var i = 0; i < halfSteps.length; i++) {
        ii += halfSteps[i];
        scale.push(thisScale[ii % SEMITONES]);
    }

    ii = scale.indexOf(pitch);
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

    if (pitch in EQUIVALENTNOTES) {
        pitch = EQUIVALENTNOTES[pitch];
    }

    ii = scale.indexOf(pitch);
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

    // current Note not in the consonant scale if this key.
    console.log(pitch + ' not found in key of ' + myKeySignature);
    return 1;
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
        for (j = 1; j < halfSteps[i]; j++) {
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


function getInterval (interval, keySignature, pitch) {
    // Step size interval based on the position (pitch) in the scale
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
 
    if (pitch in BTOFLAT) {
        pitch = BTOFLAT[pitch];
        ii = scale.indexOf(pitch);
    } else if (pitch in STOSHARP) {
        pitch = STOSHARP[pitch];
        ii = scale.indexOf(pitch);
    } else if (scale.indexOf(pitch) !== -1) {
        ii = scale.indexOf(pitch);
    } else if (pitch in EQUIVALENTNOTES) {
        pitch = EQUIVALENTNOTES[pitch];
        if (scale.indexOf(pitch) !== -1) {
            ii = scale.indexOf(pitch);
        } else {
            console.log('Note ' + pitch + ' not in scale ' + keySignature);
            ii = 0;
        }
    } else {
        // In case pitch is solfege, convert it.
        var ii = SOLFEGENAMES.indexOf(pitch);
    }

    if (interval > 0) {
        var myOctave = Math.floor(interval / SEMITONES);
        var myInterval = Math.floor(interval) % SEMITONES;
        var j = 0;
        for (var i = 0; i < (myInterval - 1); i++) {
            j += halfSteps[(ii + i) % halfSteps.length];
        }
        return j + myOctave * SEMITONES;
    } else {
        var myOctave = Math.ceil(interval / SEMITONES);
        var myInterval = Math.ceil(interval) % SEMITONES;
        var j = 0;
        for (var i = 0; i > myInterval + 1; i--) {
            var z = (ii + i - 1) % halfSteps.length;
            while (z < 0) {
                z += halfSteps.length;
            }
            j -= halfSteps[z];
        }
        return j + myOctave * SEMITONES;
    }
};

function calcNoteValueToDisplay(a, b) {
    var noteValue = a / b;
    var noteValueToDisplay = null;
    if (NOTESYMBOLS != undefined && noteValue in NOTESYMBOLS) {
        noteValueToDisplay = '1<br>&mdash;<br>' + noteValue.toString() + '<br>' + '<img src="' + NOTESYMBOLS[noteValue] + '" height=' + (MATRIXBUTTONHEIGHT / 2) * this.cellScale + '>';
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
    var dotCount = 0;

    // Try to find a match or a dotted match.
    for (dotCount = 0; dotCount < 3; dotCount++) {
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
    // the nearest note.

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
            if (cents > 50) {
                cents = 100 - cents;
            }
            break;
        }
    }

    for (var i = 0; i < 88; i++) {
        var f = A0 * Math.pow(TWELTHROOT2, i);
        if (hz < f * 1.03 && hz > f * 0.97) {
            return [PITCHES[(i + PITCHES.indexOf('A')) % 12], Math.floor((i + PITCHES.indexOf('A')) / 12), cents];
        }
    }
    console.log('could not find note/octave for ' + hz);
    return ['?', -1];
};


function numberToPitch(i) {
    // Calculate the pitch and octave based on index
    if (i < 0) {
        return ['A', 0];
    } else if (i > 87) {
        return ['C', 8];
    }
    // We start at A0.
    return [PITCHES[(i + PITCHES.indexOf('A')) % 12], Math.floor((i + PITCHES.indexOf('A')) / 12)];
};


function noteToFrequency(note, keySignature) {
    var len = note.length;
    var octave = last(note);
    var pitch = note.substring(0, len - 1);
    return pitchToFrequency(pitch, Number(octave), 0, keySignature);
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

    if (pitch in BTOFLAT) {
        pitch = BTOFLAT[pitch];
    } else if (pitch in STOSHARP) {
        pitch = STOSHARP[pitch];
    }

    var pitchNumber = 0;
    if (PITCHES.indexOf(pitch) !== -1) {
        pitchNumber = PITCHES.indexOf(pitch.toUpperCase());
    } else if (PITCHES1.indexOf(pitch.toUpperCase()) !== -1) {
        pitchNumber = PITCHES1.indexOf(pitch.toUpperCase());
    } else if (PITCHES2.indexOf(pitch.toUpperCase()) !== -1) {
        pitchNumber = PITCHES2.indexOf(pitch.toUpperCase());
    } else if (PITCHES3.indexOf(pitch.toUpperCase()) !== -1) {
        pitchNumber = PITCHES3.indexOf(pitch.toUpperCase());
    } else {
        // obj[1] is the solfege mapping for the current key/mode
        var obj = getScaleAndHalfSteps(keySignature)
        if (obj[1].indexOf(pitch.toLowerCase()) !== -1) {
            pitchNumber = obj[1].indexOf(pitch.toLowerCase());
        } else {
            console.log('pitch ' + pitch + ' not found');
            pitchNumber = 0;
        }
    }

    // We start at A0.
    return Math.max(octave, 0) * 12 + pitchNumber - PITCHES.indexOf('A');
};


function getSolfege(note) {
    if(['♯♯', '♭♭'].indexOf(note[0][1]) !== -1) {
        return SOLFEGECONVERSIONTABLE[note[0][0]] + note[0][1] + note[0][2];
    } else if(['♯', '♭'].indexOf(note[0][1]) !== -1) {
        return SOLFEGECONVERSIONTABLE[note[0][0]] + note[0][1];
    } else {
        return SOLFEGECONVERSIONTABLE[note[0][0]];
    }
};


function getNumber(solfege, octave) {
    // converts a note to a number

    if (octave < 1) {
        var num = 0;
    } else if (octave > 10) {
        var num = 9 * 12;
    } else {
        var num = 12 * (octave - 1);
    }
    solfege = String(solfege);
    if (solfege.substring(0, 1) in NOTESTEP) {
        num += NOTESTEP[solfege.substring(0, 1)];
        if (solfege.length >= 1) {
            var delta = solfege.substring(1);
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

    var note = NOTESTABLE[num];

    if (note[num] === "ti") {
        octave -= 1;
    }
    return [note, octave + 1];
};

function isInt(value) {
    return !isNaN(value) && 
    parseInt(Number(value)) == value && 
    !isNaN(parseInt(value, 10));
}

function reducedFraction(a, b) {
    greatestCommonMultiple = function(a, b) {
        return b === 0 ? a : greatestCommonMultiple(b, a % b);
    }

    var gcm = greatestCommonMultiple(a, b);
    if (NOTESYMBOLS != undefined && [1, 2, 4, 8, 16, 32, 64].indexOf(b/gcm) !== -1) {
        return (a / gcm) + '<br>&mdash;<br>' + (b / gcm) + '<br><img src=' + NOTESYMBOLS[b / gcm] + '>';
    } else {
        return (a / gcm) + '<br>&mdash;<br>' + (b / gcm) + '<br><br>';
    }
};

function Synth () {
    // Isolate synth functions here.

    // Using Tone.js
    this.tone = new Tone();

    this.synthset = {
        // builtin synths
        'poly': [null, null],
        'sine': [null, null],
        'triangle': [null, null],
        'sawtooth': [null, null],
        'square': [null, null],
        'pluck': [null, null],

        // drum samples
        'bottle': [BOTTLESOUNDSAMPLE, null],
        'clap': [CLAPSOUNDSAMPLE, null],
        'darbuka': [DARBUKASOUNDSAMPLE, null],
        'hihat': [HIHATSOUNDSAMPLE, null],
        'splash': [SPLASHSOUNDSAMPLE, null],
        'bubbles': [BUBBLESSOUNDSAMPLE, null],
        'cowbell': [COWBELLSOUNDSAMPLE, null],
        'dog': [DOGSOUNDSAMPLE, null],
        'kick': [KICKSOUNDSAMPLE, null],
        'tom': [TOMSOUNDSAMPLE, null],
        'cat': [CATSOUNDSAMPLE, null],
        'crash': [CRASHSOUNDSAMPLE, null],
        'duck': [DUCKSOUNDSAMPLE, null],
        'ridebell': [RIDEBELLSOUNDSAMPLE, null],
        'trianglebell': [TRIANGLESOUNDSAMPLE, null],
        'chine': [CHINESOUNDSAMPLE, null],
        'cricket': [CRICKETSOUNDSAMPLE, null],
        'fingercymbals': [FINGERCYMBALSSOUNDSAMPLE, null],
        'slap': [SLAPSOUNDSAMPLE, null],
        'clang': [CLANGSOUNDSAMPLE, null],
        'cup': [CUPSOUNDSAMPLE, null],
        'floortom': [FLOORTOMSOUNDSAMPLE, null],
        'snaredrum': [SNARESOUNDSAMPLE, null],
    };

    Tone.Buffer.onload = function(){
        console.log('drum loaded');
    };

    this.getSynthByName = function(name) {
        if (name == null || name == undefined) {
            return this.synthset['poly'][1];
        }

        switch (name) {    
        case 'pluck':
        case 'triangle':
        case 'square':
        case 'sawtooth':
        case 'sine':
            return this.synthset[name][1];
            break;
        case 'poly':
        case 'default':
            return this.synthset['poly'][1];
            break;
        default:
            var drumName = getDrumSynthName(name);
            if (name.slice(0, 4) == 'http') {
                // console.log('drum name is URL');
                if (name in this.synthset) {
                    // console.log('returning URL synth');
                    return this.synthset[name][1];
                } else {
                    console.log('no synth by that name');
                    return null;
                }
            } else if (drumName != null) {
                return this.synthset[drumName][1];
            } else if (name === 'drum') {
                return this.synthset[DEFAULTDRUM][1];
            }
            break;
        }

        // Use polysynth if all else fails.
        return this.synthset['poly'][1];
    };

    this.loadSynth = function(name) {
        var thisSynth = this.getSynthByName(name);
        if (thisSynth == null) {
            console.log('loading synth for ' + name);
            switch (name) {
            case 'pluck':
                this.synthset['pluck'][1] = new Tone.PluckSynth();
                break;
            case 'triangle':
            case 'square':
            case 'sawtooth':
            case 'sine':
                var synthOptions = {
                    oscillator: {
                        type: name
                    },
                    envelope: {
                        attack: 0.03,
                        decay: 0,
                        sustain: 1,
                        release: 0.03
                    },
                };
                this.synthset[name][1] = new Tone.SimpleSynth(synthOptions);
                break;
            case 'poly':
            case 'default':
                this.synthset['poly'][1] = new Tone.PolySynth(6, Tone.AMSynth);
                break;
            default:
                if (name.slice(0, 4) == 'http') {
                    // console.log('drum name is URL');
                    // console.log('initializing drum at ' + name);
                    this.synthset[name] = [name, new Tone.Sampler({'C2' : name})];
                    // console.log(this.synthset[name][1]);
                } else {
                    this.synthset[name][1] = new Tone.Sampler({'C2' : this.synthset[name][0]});
                }
                break;
            }
        }
        this.getSynthByName(name).toMaster();
    };

    this.trigger = function(notes, beatValue, name) {
        switch (name) {
        case 'pluck':
        case 'triangle':
        case 'square':
        case 'sawtooth':
        case 'sine':
            this.synthset[name][1].triggerAttackRelease(notes[0], beatValue);
            break;
        case 'poly':
        case 'default':
            this.synthset['poly'][1].triggerAttackRelease(notes, beatValue);
            break;
        default:
            var drumName = getDrumSynthName(name);
            if (drumName != null) {
                // Work around i8n bug in Firefox.
                if (drumName === '' && name in this.synthset) {
                    this.synthset[name][1].triggerAttack('C2', beatValue, 1);
                } else if (drumName in this.synthset) {
                    if (this.synthset[drumName][1] == null) {
                        console.log('something has gone terribly wrong: ' + name + ', ' + drumName);
                    } else {
                        this.synthset[drumName][1].triggerAttack('C2', beatValue, 1);
                    }
                } else {
                    console.log('something has gone terribly wrong: ' + name + ', ' + drumName);
                }
            } else if (name === 'drum') {
                this.synthset[DEFAULTDRUM][1].triggerAttack('C2', beatValue, 1);
            } else if (name.slice(0, 4) == 'http') {
                console.log('drum name is URL');
                this.synthset[name][1].triggerAttack('C2', beatValue, 1);
            } else {
                this.synthset['poly'][1].triggerAttackRelease(notes, beatValue);
            }
            break;
        }
    };

    this.stopSound = function(name) {
        this.getSynthByName(name).triggerRelease();
    };

    this.start = function() {
        Tone.Transport.start();
    };

    this.stop = function() {
        Tone.Transport.stop();
    };

    this.setVolume = function(vol) {
        var db = this.tone.gainToDb(vol / 100);
        Tone.Master.volume.rampTo(db, 0.01);
    };

    this.getOscillator = function(oscillatorName, frequency) {
        return new Tone.Oscillator(oscillatorName, frequency).toMaster();
    };
};
