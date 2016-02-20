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
const BTOFLAT = {'Eb': 'E♭', 'Gb': 'G♭', 'Ab': 'A♭', 'Bb': 'B♭', 'Db': 'D♭', 'Cb': 'C♭', 'Fb': 'F♭', 'eb': 'E♭', 'gb': 'G♭', 'ab': 'A♭', 'bb': 'B♭', 'db': 'D♭', 'cb': 'C♭', 'fb': 'F♭'};
const NOTESSHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const NOTESFLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const NOTESFLAT2 = ['c', 'd♭', 'd', 'e♭', 'e', 'f', 'g♭', 'g', 'a♭', 'a', 'b♭', 'b'];
const EXTRATRANSPOSITIONS = {'E♯': ['F', 0], 'B♯': ['C', 1], 'C♭': ['B', -1], 'F♭': ['E', 0], 'e♯': ['F', 0], 'b♯': ['C', 1], 'c♭': ['B', -1], 'f♭': ['E', 0]};
const MAJORHALFSTEPS = [_('do'), '', _('re'), '', _('mi'), _('fa'), '', _('sol'), '', _('la'), '', _('ti')];
const MINORHALFSTEPS = [_('do'), '', _('re'), _('mi'), '', _('fa'), '', _('sol'), _('la'), '', _('ti'), ''];
const NOTESYMBOLS = {1: '&#x1D15D;', 2: '&#x1D15E;', 4: '&#x1D15F;', 8: '&#x1D160;', 16: '&#x1D161;', 32: '&#x1D162;', 64: '&#x1D163;', 128: '&#x1D164;'};
const DOTTEDNOTESYMBOLS = {1: '&#x1D15D;.', 2: '&#x1D15E;.', 4: '&#x1D15F;.', 8: '&#x1D160;.', 16: '&#x1D161;.', 32: '&#x1D162;.', 64: '&#x1D163;.', 128: '&#x1D164;.'};
const DOUBLEDOTTEDNOTESYMBOLS = {1: '&#x1D15D;..', 2: '&#x1D15E;..', 4: '&#x1D15F;..', 8: '&#x1D160;..', 16: '&#x1D161;..', 32: '&#x1D162;..', 64: '&#x1D163;..', 128: '&#x1D164;..'};
const SOLFEGECONVERSIONTABLE = {'C': _('do'), 'C♯': _('do') + '♯', 'D': _('re'), 'D♯': _('re') + '♯', 'E': _('mi'), 'F': _('fa'), 'F♯': _('fa') + '♯', 'G': _('sol'), 'G♯': _('sol') + '♯', 'A': _('la'), 'A♯': _('la') + '♯', 'B': _('ti'), 'D♭': _('re') + '♭', 'E♭': _('mi') + '♭', 'G♭': _('sol') + '♭', 'A♭': _('la') + '♭', 'B♭': _('ti') + '♭', 'R': _('rest')};
const PITCHES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const PITCHES1 = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const PITCHES2 = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const PITCHES3 = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SOLFAGE = [_('do'), '', _('re'), _('me'), '', _('fa'), '', _('sol'), _('la'), '', _('ti'), ''];
const NOTESTABLE = {1: "do", 2: "do♯", 3: "re", 4: "re♯", 5: "mi", 6: "fa", 7: "fa♯", 8: "sol", 9: "sol♯", 10: "la", 11: "la♯", 0: "ti"};
const NOTESTEP = {'C': 1, 'D': 3, 'E': 5, 'F': 6, 'G': 8, 'A': 10, 'B': 12};

const POWER2 = [1, 2, 4, 8, 16, 32, 64, 128];
const TWELTHROOT2 = 1.05946309435929;
const A0 = 27.5;
const C8 = 4186.01;


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
}


function reducedFraction(a, b) {
    greatestCommonMultiple = function(a, b) {
        return b === 0 ? a : greatestCommonMultiple(b, a % b);
    }

    var gcm = greatestCommonMultiple(a, b);
    if (b / gcm in NOTESYMBOLS) {
        return (a / gcm) + '<br>&mdash;<br>' + (b / gcm) + '<br><br>' + NOTESYMBOLS[b / gcm];
    } else {
        return (a / gcm) + '<br>&mdash;<br>' + (b / gcm) + '<br><br>';
    }
}


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
}


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
}


function numberToPitch(i) {
    // Calculate the pitch and octave based on index
    if (i < 0) {
        return ['A', 0];
    } else if (i > 87) {
        return ['C', 8];
    }
    // We start at A0.
    return [PITCHES[(i + PITCHES.indexOf('A')) % 12], Math.floor((i + PITCHES.indexOf('A')) / 12)];
}


function noteToFrequency(note) {
    var len = note.length;
    var octave = last(note);
    var pitch = note.substring(0, len - 1);
    return pitchToFrequency(pitch, Number(octave));
}


function pitchToFrequency(pitch, octave) {
    // Calculate the frequency based on pitch and octave.
    var pitchNumber = pitchToNumber(pitch, octave);

    return A0 * Math.pow(TWELTHROOT2, pitchNumber);
}


function pitchToNumber(pitch, octave) {
    // Calculate the pitch index based on pitch and octave.

    var pitchNumber = 0;
    if (PITCHES.indexOf(pitch) !== -1) {
        pitchNumber = PITCHES.indexOf(pitch.toUpperCase());
    } else if (PITCHES1.indexOf(pitch.toUpperCase()) !== -1) {
        pitchNumber = PITCHES1.indexOf(pitch.toUpperCase());
    } else if (PITCHES2.indexOf(pitch.toUpperCase()) !== -1) {
        pitchNumber = PITCHES2.indexOf(pitch.toUpperCase());
    } else if (PITCHES3.indexOf(pitch.toUpperCase()) !== -1) {
        pitchNumber = PITCHES3.indexOf(pitch.toUpperCase());
    } else if (SOLFAGE.indexOf(pitch.toUpperCase()) !== -1) {
        pitchNumber = SOLFAGE.indexOf(pitch.toUpperCase());
    }

    // We start at A0.
    return Math.max(octave, 0) * 12 + pitchNumber - PITCHES.indexOf('A');
}


function getSolfege(note) {
    if(['♯♯', '♭♭'].indexOf(note[0][1]) !== -1) {
        return SOLFEGECONVERSIONTABLE[note[0][0]] + note[0][1] + note[0][2];
    } else if(['♯', '♭'].indexOf(note[0][1]) !== -1) {
        return SOLFEGECONVERSIONTABLE[note[0][0]] + note[0][1];
    } else {
        return SOLFEGECONVERSIONTABLE[note[0][0]];
    }
}


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
}


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

    if (notes[num] === "ti") {
        octave -= 1;
    }
    return [note, octave + 1];
}


function Synth () {
    // Isolate synth functions here.
    this.tone = new Tone();
    this.poly = new Tone.PolySynth(6, Tone.AMSynth).toMaster();
    this.drum = new Tone.DrumSynth().toMaster();
    var synthOptions = {
        oscillator: {
            type: "triangle"
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
            type: "square"
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
            type: "sawtooth"
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
            type: "sine"
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
    }

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
    }

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
    }

    this.start = function() {
        Tone.Transport.start();
    }

    this.stop = function() {
        Tone.Transport.stop();
    }

    this.setVolume = function(vol) {
        var db = this.tone.gainToDb(vol / 100);
        Tone.Master.volume.rampTo(db, 0.01);
    }

    this.getOscilator = function(oscillatorName, frequency) {
        return new Tone.Oscillator(oscillatorName, frequency).toMaster();
    }
}
