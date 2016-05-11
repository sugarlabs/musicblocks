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

// The table contains the intervals that define the modes.
// All of these modes assume 12 semitones per octave.
// See http://www.pianoscales.org
const MUSICALMODES = {
     // 8 notes in an octave
    'ALGERIAN': [2, 1, 2, 1, 1, 1, 3, 1],
    'DIMINISHED': [2, 1, 2, 1, 2, 1, 2, 1],
    'SPANISH': [1, 2, 1, 1, 1, 2, 2, 2],

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
    'JAZZ': [2, 1, 2, 2, 2, 2, 1],
    'AEOLIAN': [2, 2, 1, 2, 1, 2, 2],

    'ARABIC': [2, 2, 1, 1, 2, 2, 2],
    'BYZANTINE': [1, 3, 1, 2, 1, 3, 1],
    'ENIGMATIC': [1, 3, 2, 2, 2, 1, 1],
    'ETHIOPIAN': [2, 1, 2, 2, 1, 2, 2],
    'GEEZ': [2, 1, 2, 2, 1, 2, 2],
    'HINDU': [2, 2, 1, 2, 1, 2, 2],
    'HUNGARIAN': [2, 1, 3, 1, 1, 3, 1],
    'ROMANIAN': [2, 1, 3, 1, 2, 1, 2],
    'ROMANIAN MINOR': [2, 1, 3, 1, 2, 1, 2],
    'SPANISH GYPSY': [1, 3, 1, 2, 1, 2, 2],
    'GYPSY': [1, 3, 1, 2, 1, 2, 2],
    'MAQAM': [1, 3, 1, 2, 1, 3, 1],

    // 6 notes in an octave
    'BLUES': [3, 2, 1, 1, 3, 2],
    'PENTATONIC BLUES': [3, 2, 1, 1, 3, 2],
    'PENTATONIC MAJOR BLUES': [2, 1, 1, 3, 2, 2],

    // 5 notes in an octave
    'PENTATONIC': [3, 2, 2, 3, 2],
    'CHINESE': [4, 2, 1, 4, 1],
    'EGYPTIAN': [2, 3, 2, 3, 2],
    'HIRAJOSHI': [1, 4, 1, 4, 2],
    'JAPANESE': [1, 4, 2, 3, 2],
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
    // Returns how many half-steps to the next note in this key.
    var obj = keySignatureToMode(keySignature);
    var myKeySignature = obj[0];
    var halfSteps = MUSICALMODES[obj[1]];

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
        return halfSteps[ii];
    }

    if (pitch in EQUIVALENTNOTES) {
        pitch = EQUIVALENTNOTES[pitch];
    }

    ii = scale.indexOf(pitch);
    if (ii !== -1) {
        return halfSteps[ii];
    }

    // current Note not in the consonant scale if this key.
    console.log(pitch + ' not found in key of ' + myKeySignature);
    return 1;
};


function getStepSizeDown(keySignature, pitch) {
    // Returns next note down in current scale.
    var obj = keySignatureToMode(keySignature);
    var myKeySignature = obj[0];
    var halfSteps = MUSICALMODES[obj[1]];

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
        if (ii > 0) {
            return -halfSteps[ii - 1];
        } else {
            return -last(halfSteps);
        }
    }

    if (pitch in EQUIVALENTNOTES) {
        pitch = EQUIVALENTNOTES[pitch];
    }

    ii = scale.indexOf(pitch);
    if (ii !== -1) {
        if (ii > 0) {
            return -halfSteps[ii - 1];
        } else {
            return -last(halfSteps);
        }
    }

    // current Note not in the consonant scale if this key.
    console.log(pitch + ' not found in key of ' + myKeySignature);
    return -1;
};


function getScaleAndHalfSteps(keySignature) {
    // Determine scale and half-step pattern from key signature
    var obj = keySignatureToMode(keySignature);
    var myKeySignature = obj[0];
    var halfSteps = MUSICALMODES[obj[1]];

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

    var major = obj[1] === 'MAJOR' || obj[1] === 'IONIAN';

    if (myKeySignature in EXTRATRANSPOSITIONS) {
        myKeySignature = EXTRATRANSPOSITIONS[myKeySignature][0];
    }

    return [thisScale, solfege, myKeySignature, major];
};


function getInterval (interval, keySignature) {
    // Calculate the interval in terms of halfsteps for current mode.
    var obj = getScaleAndHalfSteps(keySignature);
    var halfSteps = obj[1];

    var myOctave = Math.floor(interval / halfSteps.length);
    var myInterval = Math.floor(interval) % halfSteps.length;

    var ii = 0;
    for (var i = 0; i < myInterval; i++) {
        ii += halfSteps[i];
    }

    return ii + myOctave * SEMITONES;
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

    for (var i = 0; i < 88; i++) {
        var f = A0 * Math.pow(TWELTHROOT2, i);
        if (hz < f * 1.03 && hz > f * 0.97) {
            return [PITCHES[(i + PITCHES.indexOf('A')) % 12], Math.floor((i + PITCHES.indexOf('A')) / 12)];
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
    return pitchToFrequency(pitch, Number(octave), keySignature);
};


function pitchToFrequency(pitch, octave, keySignature) {
    // Calculate the frequency based on pitch and octave.
    var pitchNumber = pitchToNumber(pitch, octave, keySignature);

    return A0 * Math.pow(TWELTHROOT2, pitchNumber);
};


function pitchToNumber(pitch, octave, keySignature) {
    // Calculate the pitch index based on pitch and octave.

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
        if (obj[1].indexOf(pitch.tolowerCase()) !== -1) {
            pitchNumber = obj[1].indexOf(pitch.tolowerCase());
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


function Synth () {
    // Isolate synth functions here.
    this.tone = new Tone();
    this.poly = new Tone.PolySynth(6, Tone.AMSynth).toMaster();

    var synthOptions = {
        oscillator: {
            type: 'sine'
        },
        envelope: {
            attack: 0.001,
            decay: 0.4,
            sustain: 0.01,
            release: 1.4,
            attackCurve:'exponential'
        }
    }

    // this.drum = new Tone.SimpleSynth(synthOptions);
    this.drum = new Tone.DrumSynth().toMaster();

    var synthOptions = {
        oscillator: {
            type: 'triangle'
        },
        envelope: {
            attack: 0.03,
            decay: 0,
            sustain: 1,
            release: 0.03
        },
    };

    this.triangle = new Tone.SimpleSynth(synthOptions);

    var synthOptions = {
        oscillator: {
            type: 'square'
        },
        envelope: {
            attack: 0.03,
            decay: 0,
            sustain: 1,
            release: 0.03
        },
    };

    this.square = new Tone.SimpleSynth(synthOptions);

    var synthOptions = {
        oscillator: {
            type: 'sawtooth'
        },
        envelope: {
            attack: 0.03,
            decay: 0,
            sustain: 1,
            release: 0.03
        },
    };

    this.sawtooth = new Tone.SimpleSynth(synthOptions);

    var synthOptions = {
        oscillator: {
            type: 'sine'
        },
        envelope: {
            attack: 0.03,
            decay: 0,
            sustain: 1,
            release: 0.03
        },
    };

    this.sine = new Tone.SimpleSynth(synthOptions);

    this.init = function(name) {
        switch (name) {
        case 'drum':
            this.drum.toMaster();
            break;
        case 'triangle':
            this.triangle.toMaster();
            break;
        case 'square':
            this.square.toMaster();
            break;
        case 'sawtooth':
            this.sawtooth.toMaster();
            break;
        case 'sine':
            this.sine.toMaster();
            break;
        default:
            this.poly.toMaster();
            break;
        }
    };

    this.trigger = function(notes, beatValue, name) {
        switch (name) {
        case 'drum':
            this.drum.triggerAttackRelease(notes[0], beatValue);
            break;
        case 'triangle':
            this.triangle.triggerAttackRelease(notes[0], beatValue);
            break;
        case 'square':
            this.square.triggerAttackRelease(notes[0], beatValue);
            break;
        case 'sawtooth':
            this.sawtooth.triggerAttackRelease(notes[0], beatValue);
            break;
        case 'sine':
            this.sine.triggerAttackRelease(notes[0], beatValue);
            break;
        default:
            this.poly.triggerAttackRelease(notes, beatValue);
            break;
        }
    };

    this.stopSound = function(name) {
        switch (name) {
        case 'drum':
            this.drum.triggerRelease();
            break;
        case 'triangle':
            this.triangle.triggerRelease();
            break;
        case 'square':
            this.square.triggerRelease();
            break;
        case 'sawtooth':
            this.sawtooth.triggerRelease();
            break;
        case 'sine':
            this.sine.triggerRelease();
            break;
        default:
            this.poly.triggerRelease();
            break;
        }
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
